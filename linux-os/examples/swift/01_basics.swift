// Swift basics: let/var, arrays, dictionaries and string interpolation
let names = ["Swift", "SwiftUI", "Xcode"]
for name in names {
    print("Hello, \(name)!")
}

var scores: [String: Int] = ["Ada": 92, "Tim": 85]
scores["Craig"] = 97
for (who, score) in scores.sorted(by: { $0.value > $1.value }) {
    print("\(who): \(score)")
}

for i in 1...5 {
    print("\(i) squared is \(i * i)")
}
