# Decorators wrap functions to add behaviour
import functools
import time

def timed(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        ms = (time.perf_counter() - start) * 1000
        print(f"{func.__name__} took {ms:.2f} ms")
        return result
    return wrapper

@functools.lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

@timed
def big_fib():
    return fib(300)

print(big_fib())
