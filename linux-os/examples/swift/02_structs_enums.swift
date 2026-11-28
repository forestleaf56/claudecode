// Structs, enums and switch
enum Weather {
    case sunny, cloudy, rainy(mm: Int)
}

struct Day {
    let name: String
    let weather: Weather

    func describe() -> String {
        switch weather {
        case .sunny: return "\(name): sunny, wear sunglasses"
        case .cloudy: return "\(name): cloudy, perfect for Cirrus"
        case .rainy(let mm) where mm > 10: return "\(name): heavy rain (\(mm) mm), stay inside"
        case .rainy(let mm): return "\(name): light rain (\(mm) mm), take an umbrella"
        }
    }
}

let week = [Day(name: "Mon", weather: .sunny), Day(name: "Tue", weather: .rainy(mm: 3)), Day(name: "Wed", weather: .cloudy), Day(name: "Thu", weather: .rainy(mm: 25))]
for d in week {
    print(d.describe())
}
