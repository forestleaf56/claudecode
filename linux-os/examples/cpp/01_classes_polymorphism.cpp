#include <iostream>
#include <memory>
#include <vector>
#include <cmath>
using namespace std;

// Virtual functions and polymorphism
class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual string name() const = 0;
};

class Circle : public Shape {
    double r;
public:
    explicit Circle(double r) : r(r) {}
    double area() const override { return M_PI * r * r; }
    string name() const override { return "Circle"; }
};

class Square : public Shape {
    double s;
public:
    explicit Square(double s) : s(s) {}
    double area() const override { return s * s; }
    string name() const override { return "Square"; }
};

int main() {
    vector<unique_ptr<Shape>> shapes;
    shapes.push_back(make_unique<Circle>(1.5));
    shapes.push_back(make_unique<Square>(2));
    shapes.push_back(make_unique<Circle>(0.5));
    double total = 0;
    for (const auto& s : shapes) {
        cout << s->name() << " area: " << s->area() << endl;
        total += s->area();
    }
    cout << "Total area: " << total << endl;
    return 0;
}
