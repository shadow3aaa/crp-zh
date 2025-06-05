# 异常与错误处理

在 C++ 中，需要由调用者处理的错误有时通过哨兵值（如 `std::map::find` 返回空迭代器）表示，有时通过异常（如 `std::vector::at` 抛出 `std::out_of_range`）表示，还有时通过设置错误位（如 `std::fstream::fail`）表示。不打算由调用者处理的错误通常通过异常表示（如 `std::bad_cast`）。由于编程错误导致的错误通常会导致未定义行为（如 `std::vector::operator[]` 越界访问时）。

相比之下，安全的 Rust 有两种指示错误的机制。当错误预期由调用者处理（例如由于用户输入）时，函数返回 [`Result`](https://doc.rust-lang.org/std/result/index.html) 或 [`Option`](https://doc.rust-lang.org/std/option/index.html)。当错误是由于编程错误导致时，函数会 panic。只有在使用 unsafe Rust 并调用未检查的函数变体时，才可能出现未定义行为。

许多 Rust 库会提供 API 的两个版本，一个返回 `Result` 或 `Option` 类型，另一个在出错时 panic，这样调用者可以选择如何解释错误（预期的异常情况或程序员错误）。

使用 `Result` 或 `Option` 与使用异常的主要区别在于：

1. `Result` 和 `Option` 强制在访问包含的值之前显式处理错误情况。这一点也不同于 C++23 的 `std::expected`。
2. 在用 `Result` 传播错误时，错误类型必须匹配。为简化处理，有一些相关库可用。

## `Result` 与 `Option`

本章 Rust 示例中演示的方法适用于 `Result` 和 `Option`。当类型为 `Option` 时，表示在错误情况下没有额外信息可提供：`Option::None` 不包含值，而 `Result::Err` 包含。当没有额外信息时，通常是因为只有一种情况会导致错误。

这两种类型可以相互转换。

```rust
fn main() {
    let r: Result<i32, &'static str> =
        None.ok_or("my errror message");
    let r2: Result<i32, &'static str> =
        None.ok_or_else(|| "expensive error message");
    let o: Option<i32> = r.ok();
}
