#include <iostream>
#include <string>
using namespace std;

// Function and class templates
template <typename T>
T biggest(T a, T b, T c) {
    T m = a;
    if (b > m) m = b;
    if (c > m) m = c;
    return m;
}

template <typename T, int N>
class FixedList {
    T items[N];
    int count = 0;
public:
    bool add(const T& x) { if (count == N) return false; items[count++] = x; return true; }
    int size() const { return count; }
    T operator[](int i) const { return items[i]; }
};

int main() {
    cout << biggest(3, 9, 4) << endl;
    cout << biggest(2.5, 1.5, 2.25) << endl;
    cout << biggest(string("pear"), string("apple"), string("plum")) << endl;

    FixedList<string, 3> list;
    for (string s : {"one", "two", "three", "four"}) {
        cout << "add " << s << ": " << (list.add(s) ? "ok" : "full") << endl;
    }
    cout << "size = " << list.size() << ", first = " << list[0] << endl;
    return 0;
}
