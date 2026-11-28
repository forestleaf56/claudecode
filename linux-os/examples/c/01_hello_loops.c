#include <stdio.h>

/* Loops, functions and printf formatting */
int square(int x) {
    return x * x;
}

int main(void) {
    printf("Hello from C!\n");
    for (int i = 1; i <= 5; i++) {
        printf("%d squared is %d\n", i, square(i));
    }
    int n = 10;
    while (n > 0) {
        printf("%d ", n);
        n -= 3;
    }
    printf("\nLiftoff!\n");
    return 0;
}
