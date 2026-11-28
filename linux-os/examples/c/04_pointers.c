#include <stdio.h>

/* Pointers: swap two values and walk an array */
void swap(int *a, int *b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

int sum(const int *arr, int len) {
    int total = 0;
    for (const int *p = arr; p < arr + len; p++) total += *p;
    return total;
}

int main(void) {
    int x = 1, y = 2;
    printf("before: x=%d y=%d\n", x, y);
    swap(&x, &y);
    printf("after:  x=%d y=%d\n", x, y);

    int nums[] = {5, 10, 15, 20};
    printf("sum = %d\n", sum(nums, 4));
    printf("address of nums[1] is %d bytes after nums[0]\n", (int)((char *)&nums[1] - (char *)&nums[0]));
    return 0;
}
