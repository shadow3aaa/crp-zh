# 多返回值

在 C++ 中，从函数或方法返回多个值的一种惯用法是传入引用参数，由函数对这些引用赋值。

这种惯用法可能被采用的原因有：

- 需要兼容 C++11 之前的版本，
- 代码库采用了 C 风格的 C++，
- 或出于性能考虑。

将该模式惯用地翻译到 Rust 时，通常会使用 [元组](https://doc.rust-lang.org/std/primitive.tuple.html) 或具名结构体作为返回类型。

<div class="comparison">

```cpp
void get_point(int &x, int &y) {
  x = 5;
  y = 6;
}

int main() {
  int x, y;
  get_point(x, y);
  // ...
}
```

```rust
fn get_point() -> (i32, i32) {
    (5, 6)
}

fn main() {
    let (x, y) = get_point();
    // ...
}
```

</div>

Rust 拥有专门的元组语法，并支持 `let` 绑定的模式匹配，部分原因正是为了支持类似这样的用例。

## 直接翻译的弊端

虽然可以将原本使用输出参数的示例直接翻译为 Rust，但 Rust 要求变量在传递给函数前必须初始化。这样写出来的程序并不是惯用的 Rust。

```rust
// 非惯用 Rust
fn get_point(x: &mut i32, y: &mut i32) {
    *x = 5;
    *y = 6;
}

fn main() {
    let mut x = 0; // 必须初始化为任意值
    let mut y = 0;
    get_point(&mut x, &mut y);
    // ...
}
```

这种方式要求变量赋予任意初值，并且必须是可变的，这会让编译器更难帮助开发者避免编程错误。

此外，Rust 编译器对惯用写法的优化更好，生成的二进制文件也显著更快。

在某些情况下（如需要复用整个内存缓冲区时），内存分配的性能可能成为关注点，这时权衡会有所不同。相关内容详见[预分配缓冲区](./pre-allocated_buffers.md)章节。

## 与 C++11 及之后惯用法的相似之处

自 C++11 起，`std::pair` 和 `std::tuple` 可用于返回多个值，而不是通过引用参数赋值。

```cpp
#include <tuple>
#include <utility>

std::pair<int, int> get_point() {
  return std::make_pair(5, 6);
}

int main() {
  int x, y;
  std::tie(x, y) = get_point();
  // ...
}
```

这种方式与 Rust 返回多个值的惯用法更为接近。

{{#quiz multiple_return.toml}}
