#include <stdio.h>

/* Reads numbers from input (type them when asked) */
int main(void) {
    int count;
    printf("How many numbers? ");
    if (scanf("%d", &count) != 1) return 1;
    double total = 0, x;
    for (int i = 0; i < count; i++) {
        printf("Number %d: ", i + 1);
        if (scanf("%lf", &x) != 1) return 1;
        total += x;
    }
    printf("\nSum = %.2f, average = %.2f\n", total, count ? total / count : 0);
    return 0;
}
