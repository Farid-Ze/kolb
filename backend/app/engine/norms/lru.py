from collections import OrderedDict
from threading import Lock

class _LRU(OrderedDict):
    def __init__(self, maxsize: int = 4096):
        super().__init__()
        self.maxsize = maxsize
        self._lock = Lock()

    def get_or_set(self, key, factory):
        with self._lock:
            try:
                value = self.pop(key)
                self[key] = value
                return value
            except KeyError:
                value = factory()
                self[key] = value
                if len(self) > self.maxsize:
                    self.popitem(last=False)
                return value
    
    def get(self, key, default=None):
        with self._lock:
            return super().get(key, default)

    def __setitem__(self, key, value):
        with self._lock:
            super().__setitem__(key, value)
            if len(self) > self.maxsize:
                self.popitem(last=False)
