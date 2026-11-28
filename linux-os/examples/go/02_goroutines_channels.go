package main

import (
	"fmt"
	"sync"
	"time"
)

// Goroutines run concurrently; channels pass results back
func worker(id int, jobs <-chan int, results chan<- string, wg *sync.WaitGroup) {
	defer wg.Done()
	for n := range jobs {
		time.Sleep(time.Duration(n) * 10 * time.Millisecond)
		results <- fmt.Sprintf("worker %d squared %d = %d", id, n, n*n)
	}
}

func main() {
	jobs := make(chan int, 10)
	results := make(chan string, 10)
	var wg sync.WaitGroup
	for w := 1; w <= 3; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}
	for n := 1; n <= 6; n++ {
		jobs <- n
	}
	close(jobs)
	wg.Wait()
	close(results)
	count := 0
	for r := range results {
		fmt.Println(r)
		count++
	}
	fmt.Println(count, "jobs done")
}
