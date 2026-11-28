#include <stdio.h>
#include <math.h>

/* Structs and passing them to functions */
typedef struct {
    double x;
    double y;
} Point;

double distance(Point a, Point b) {
    double dx = a.x - b.x, dy = a.y - b.y;
    return sqrt(dx * dx + dy * dy);
}

int main(void) {
    Point route[] = {{0, 0}, {3, 4}, {6, 8}, {6, 0}};
    int n = sizeof(route) / sizeof(route[0]);
    double total = 0;
    for (int i = 1; i < n; i++) {
        double d = distance(route[i - 1], route[i]);
        printf("(%.0f,%.0f) -> (%.0f,%.0f): %.2f\n", route[i - 1].x, route[i - 1].y, route[i].x, route[i].y, d);
        total += d;
    }
    printf("Total distance: %.2f\n", total);
    return 0;
}
