# 零长度数组

在采用 C 风格编写或使用 C 库的 C++ 代码库中，空数组通常用空指针（null pointer）来表示。

在 Rust 中，任意大小的数组通过 [切片（slice）](https://doc.rust-lang.org/book/ch04-03-slices.html) 表示。切片可以具有零长度。而且 [Rust 的向量（Vec）可以自动转换为切片](https://doc.rust-lang.org/std/vec/struct.Vec.html#impl-Deref-for-Vec%3CT,+A%3E)，因此如果函数以切片作为参数，也可以直接传递向量。

<div class="comparison">

```cpp
#include <cstddef>
#include <cassert>

int c_style_sum(std::size_t len, int arr[]) {
    int sum = 0;
    for (size_t i = 0; i < len; i++) {
        sum += arr[i];
    }
    return sum;
}

int main() {
    int sum = c_style_sum(0, nullptr);
    assert(sum == 0);
}
```

```rust
fn sum_slice(arr: &[i32]) -> i32 {
    let mut sum = 0;
    for x in arr {
        sum += x;
    }
    sum
}

fn main() {
    let sum = sum_slice(&[]);
    assert!(sum == 0);

    let sum2 = sum_slice(&vec![]);
    assert!(sum2 == 0);
}
```

</div>

{{#quiz zero_length_arrays.toml}}
