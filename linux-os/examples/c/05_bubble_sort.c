#include <stdio.h>

/* Bubble sort an array in place */
void bubble_sort(int a[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (a[j] > a[j + 1]) {
                int t = a[j];
                a[j] = a[j + 1];
                a[j + 1] = t;
            }
        }
    }
}

void print(const char *label, int a[], int n) {
    printf("%s", label);
    for (int i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\n");
}

int main(void) {
    int data[] = {42, 7, 19, 3, 88, 21, 56, 1};
    int n = 8;
    print("before:", data, n);
    bubble_sort(data, n);
    print("after: ", data, n);
    return 0;
}
