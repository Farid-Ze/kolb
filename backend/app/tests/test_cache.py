import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock, patch
from app.core.cache import cached, RedisCache
from app.core.config import settings

# Mock Redis to avoid needing a running instance for unit tests
@pytest.fixture
def mock_redis():
    with patch("app.core.cache.from_url") as mock_from_url:
        mock_client = AsyncMock()
        mock_from_url.return_value = mock_client
        yield mock_client

@pytest.mark.asyncio
async def test_cached_decorator(mock_redis):
    # Enable cache for test
    with patch.object(settings, "cache_enabled", True):
        # Reset global cache instance to pick up mock
        from app.core import cache
        cache.cache = RedisCache()
        
        # Define a function to cache
        call_count = 0
        @cached(ttl=60)
        async def expensive_func(x: int):
            nonlocal call_count
            call_count += 1
            return x * 2
            
        # First call: Cache miss
        mock_redis.get.return_value = None
        result1 = await expensive_func(10)
        assert result1 == 20
        assert call_count == 1
        mock_redis.set.assert_called_once()
        
        # Second call: Cache hit (simulate redis returning value)
        mock_redis.get.return_value = "20" # Redis returns strings/bytes usually, json.loads handles it
        # Wait, our cache implementation uses json.loads. 
        # If we mock get returning "20", json.loads("20") is 20. Correct.
        
        result2 = await expensive_func(10)
        assert result2 == 20
        # Call count should NOT increase if cache hit logic works
        # BUT: The decorator logic calls cache.get. 
        # If cache.get returns value, it returns.
        # We need to ensure our mock setup correctly simulates the hit.
        
        # Re-verify logic:
        # 1. wrapper calls cache.get
        # 2. cache.get calls redis.get
        # 3. redis.get returns "20"
        # 4. cache.get does json.loads("20") -> 20
        # 5. wrapper returns 20
        # 6. func is NOT called.
        
        # However, the decorator is already defined wrapping the function.
        # The 'cache' object inside the decorator is the global 'cache' object from app.core.cache.
        # We updated cache.cache = RedisCache() which updates the module level variable.
        # Does the decorator capture the variable or the object?
        # It captures the global 'cache' variable name lookup. So it should work.
        
        # Let's test it.
