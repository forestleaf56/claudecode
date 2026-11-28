#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

// Lambdas with <algorithm> and <numeric>
int main() {
    vector<int> v(10);
    iota(v.begin(), v.end(), 1);  // 1..10

    vector<int> squares;
    transform(v.begin(), v.end(), back_inserter(squares), [](int x) { return x * x; });
    int evens = count_if(squares.begin(), squares.end(), [](int x) { return x % 2 == 0; });
    int sum = accumulate(squares.begin(), squares.end(), 0);

    cout << "squares:";
    for (int s : squares) cout << ' ' << s;
    cout << "\neven squares: " << evens << "\nsum: " << sum << endl;

    int threshold = 30;
    auto big = find_if(squares.begin(), squares.end(), [threshold](int x) { return x > threshold; });
    cout << "first square above " << threshold << ": " << *big << endl;
    return 0;
}
