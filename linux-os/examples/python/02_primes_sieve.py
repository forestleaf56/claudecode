# Sieve of Eratosthenes: find all primes below a limit
def primes_below(limit):
    is_prime = [True] * limit
    is_prime[0] = is_prime[1] = False
    for n in range(2, int(limit ** 0.5) + 1):
        if is_prime[n]:
            for multiple in range(n * n, limit, n):
                is_prime[multiple] = False
    return [n for n, p in enumerate(is_prime) if p]

primes = primes_below(100)
print(f"{len(primes)} primes below 100:")
print(primes)
