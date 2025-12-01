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
        if settings.cache_enabled:
            try:
                self._redis = from_url(settings.redis_url, decode_responses=True)
                logger.info(f"Redis cache initialized at {settings.redis_url}")
            except Exception as e:
                logger.error(f"Failed to initialize Redis: {e}")
                self._redis = None

    async def get(self, key: str) -> Optional[Any]:
        if not self._redis:
            return None
        try:
            value = await self._redis.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.warning(f"Redis get error for {key}: {e}")
        return None

    async def set(self, key: str, value: Any, ttl: int = 300) -> None:
        if not self._redis:
            return
        try:
            await self._redis.set(key, json.dumps(value), ex=ttl)
        except Exception as e:
            logger.warning(f"Redis set error for {key}: {e}")

    async def delete(self, key: str) -> None:
        if not self._redis:
            return
        try:
            await self._redis.delete(key)
        except Exception as e:
            logger.warning(f"Redis delete error for {key}: {e}")
            
    async def close(self):
        if self._redis:
            await self._redis.close()

class RedisCacheSync:
    def __init__(self):
        self._redis: Optional[SyncRedis] = None
        if settings.cache_enabled:
            try:
                self._redis = sync_from_url(settings.redis_url, decode_responses=True)
                logger.info(f"Sync Redis cache initialized at {settings.redis_url}")
            except Exception as e:
                logger.error(f"Failed to initialize Sync Redis: {e}")
                self._redis = None

    def get(self, key: str) -> Optional[Any]:
        if not self._redis:
            return None
        try:
            value = self._redis.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.warning(f"Sync Redis get error for {key}: {e}")
        return None

    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        if not self._redis:
            return
        try:
            self._redis.set(key, json.dumps(value), ex=ttl)
        except Exception as e:
            logger.warning(f"Sync Redis set error for {key}: {e}")

    def delete(self, key: str) -> None:
        if not self._redis:
            return
        try:
            self._redis.delete(key)
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
            
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Default key generation: func_name:hash(args)
                arg_str = f"{args}:{kwargs}"
                arg_hash = hashlib.md5(arg_str.encode()).hexdigest()
                cache_key = f"{func.__name__}:{arg_hash}"
            
            cached_value = await cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            result = await func(*args, **kwargs)
            
            if result is not None:
                await cache.set(cache_key, result, ttl)
                
            return result
        return wrapper
    return decorator
