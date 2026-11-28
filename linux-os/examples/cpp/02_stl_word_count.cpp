#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

// Count words with std::map, then sort by frequency
int main() {
    string text = "the quick brown fox jumps over the lazy dog the fox";
    map<string, int> counts;
    istringstream in(text);
    string word;
    while (in >> word) counts[word]++;

    vector<pair<string, int>> items(counts.begin(), counts.end());
    sort(items.begin(), items.end(), [](const auto& a, const auto& b) { return a.second > b.second; });
    for (const auto& [w, n] : items) {
        cout << w << ": " << n << endl;
    }
    return 0;
}
