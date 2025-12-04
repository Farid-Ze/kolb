import json
import logging
from typing import Any, Callable, Optional, TypeVar
from functools import wraps
import hashlib

from redis.asyncio import Redis, from_url
from redis import Redis as SyncRedis, from_url as sync_from_url
from app.core.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")

class RedisCache:
    def __init__(self):
        self._redis: Optional[Redis] = None
        self._initialized = False

    async def _ensure_connection(self) -> Optional[Redis]:
        """Lazy initialization of Redis connection."""
        if self._initialized:
            return self._redis
        self._initialized = True
        if settings.cache_enabled:
            try:
                self._redis = from_url(
                    settings.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=2,  # 2 second timeout
                    socket_timeout=2,
                )
                # Test connection with ping
                await self._redis.ping()
                logger.info(f"Redis cache initialized at {settings.redis_url}")
            except Exception as e:
                logger.error(f"Failed to initialize Redis: {e}")
                self._redis = None
        return self._redis

    async def get(self, key: str) -> Optional[Any]:
        redis = await self._ensure_connection()
        if not redis:
            return None
        try:
            value = await redis.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.warning(f"Redis get error for {key}: {e}")
        return None

    async def set(self, key: str, value: Any, ttl: int = 300) -> None:
        redis = await self._ensure_connection()
        if not redis:
            return
        try:
            await redis.set(key, json.dumps(value), ex=ttl)
        except Exception as e:
            logger.warning(f"Redis set error for {key}: {e}")

    async def delete(self, key: str) -> None:
        redis = await self._ensure_connection()
        if not redis:
            return
        try:
            await redis.delete(key)
        except Exception as e:
            logger.warning(f"Redis delete error for {key}: {e}")
            
    async def close(self):
        if self._redis:
            await self._redis.close()

class RedisCacheSync:
    def __init__(self):
        self._redis: Optional[SyncRedis] = None
        self._initialized = False

    def _ensure_connection(self) -> Optional[SyncRedis]:
        """Lazy initialization of Redis connection."""
        if self._initialized:
            return self._redis
        self._initialized = True
        if settings.cache_enabled:
            try:
                self._redis = sync_from_url(
                    settings.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=2,  # 2 second timeout
                    socket_timeout=2,
                )
                # Test connection with ping
                self._redis.ping()
                logger.info(f"Sync Redis cache initialized at {settings.redis_url}")
            except Exception as e:
                logger.error(f"Failed to initialize Sync Redis: {e}")
                self._redis = None
        return self._redis

    def get(self, key: str) -> Optional[Any]:
        redis = self._ensure_connection()
        if not redis:
            return None
        try:
            value = redis.get(key)
            if value and isinstance(value, (str, bytes, bytearray)):
                return json.loads(value)
        except Exception as e:
            logger.warning(f"Sync Redis get error for {key}: {e}")
        return None

    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        redis = self._ensure_connection()
        if not redis:
            return
        try:
            redis.set(key, json.dumps(value), ex=ttl)
        except Exception as e:
            logger.warning(f"Sync Redis set error for {key}: {e}")

    def delete(self, key: str) -> None:
        redis = self._ensure_connection()
        if not redis:
            return
        try:
            redis.delete(key)
        except Exception as e:
            logger.warning(f"Sync Redis delete error for {key}: {e}")

cache = RedisCache()
sync_cache = RedisCacheSync()

def cached(ttl: int = 300, key_builder: Optional[Callable[..., str]] = None):
    """
    Async decorator to cache function results in Redis.
    """
    def decorator(func: Callable[..., Any]):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not settings.cache_enabled:
                return await func(*args, **kwargs)
            
            try:
                if key_builder:
                    cache_key = key_builder(*args, **kwargs)
                    if not isinstance(cache_key, str):
                        logger.warning(f"key_builder for {func.__name__} returned non-string: {type(cache_key)}")
                        return await func(*args, **kwargs)
                else:
                    # Default key generation: func_name:hash(args)
                    arg_str = f"{args}:{kwargs}"
                    arg_hash = hashlib.md5(arg_str.encode()).hexdigest()
                    cache_key = f"{func.__name__}:{arg_hash}"
            except Exception as e:
                logger.warning(f"Failed to generate cache key for {func.__name__}: {e}")
                return await func(*args, **kwargs)
            
            cached_value = await cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            result = await func(*args, **kwargs)
            
            if result is not None:
                try:
                    await cache.set(cache_key, result, ttl)
                except TypeError as e:
                     logger.warning(f"Failed to cache result for {func.__name__} (serialization error): {e}")
                except Exception as e:
                     logger.warning(f"Failed to cache result for {func.__name__}: {e}")
                
            return result
        return wrapper
    return decorator
