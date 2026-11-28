#include <stdio.h>
#include <stdbool.h>

/* Print primes with trial division */
bool is_prime(int n) {
    if (n < 2) return false;
    for (int d = 2; d * d <= n; d++) {
        if (n % d == 0) return false;
    }
    return true;
}

int main(void) {
    int count = 0;
    for (int n = 2; n < 100; n++) {
        if (is_prime(n)) {
            printf("%4d", n);
            if (++count % 10 == 0) printf("\n");
        }
    }
    printf("\n%d primes below 100\n", count);
    return 0;
}
