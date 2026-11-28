#include <stdio.h>

/* The classic Fahrenheit-Celsius table */
int main(void) {
    printf("%5s %8s\n", "F", "C");
    for (int f = 0; f <= 300; f += 20) {
        printf("%5d %8.1f\n", f, (5.0 / 9.0) * (f - 32));
    }
    return 0;
}
