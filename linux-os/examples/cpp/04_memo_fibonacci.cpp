#include <iostream>
#include <unordered_map>
using namespace std;

// Recursion with memoization
unordered_map<int, unsigned long long> memo;

unsigned long long fib(int n) {
    if (n < 2) return n;
    auto it = memo.find(n);
    if (it != memo.end()) return it->second;
    return memo[n] = fib(n - 1) + fib(n - 2);
}

int main() {
    for (int n : {10, 20, 40, 60, 90}) {
        cout << "fib(" << n << ") = " << fib(n) << endl;
    }
    return 0;
}
