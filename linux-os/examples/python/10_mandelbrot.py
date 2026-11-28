# ASCII Mandelbrot set
chars = " .:-=+*#%@"
for row in range(24):
    line = ""
    for col in range(70):
        c = complex(-2.2 + col * 0.045, -1.2 + row * 0.1)
        z = 0
        n = 0
        while abs(z) <= 2 and n < 30:
            z = z * z + c
            n += 1
        line += chars[n * (len(chars) - 1) // 30]
    print(line)
