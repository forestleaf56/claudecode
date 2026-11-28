// Three sorting algorithms compared
function bubbleSort(arr) {
  const a = [...arr];
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < a.length - i - 1; j++)
      if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
  return a;
}

function quickSort(a) {
  if (a.length < 2) return a;
  const [pivot, ...rest] = a;
  return [...quickSort(rest.filter((x) => x < pivot)), pivot, ...quickSort(rest.filter((x) => x >= pivot))];
}

function mergeSort(a) {
  if (a.length < 2) return a;
  const mid = a.length >> 1;
  const left = mergeSort(a.slice(0, mid)), right = mergeSort(a.slice(mid));
  const out = [];
  while (left.length && right.length) out.push(left[0] <= right[0] ? left.shift() : right.shift());
  return [...out, ...left, ...right];
}

const data = Array.from({ length: 12 }, () => Math.floor(Math.random() * 100));
console.log('Input: ', data.join(' '));
console.log('Bubble:', bubbleSort(data).join(' '));
console.log('Quick: ', quickSort(data).join(' '));
console.log('Merge: ', mergeSort(data).join(' '));
