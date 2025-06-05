# 预期错误

在 C++ 中，`throw` 既产生一个错误（被抛出的异常），又启动了非本地控制流（展开到最近的 `catch` 块）。在 Rust 中，错误值（`Option::None` 或 `Result::Err`）作为普通值从函数返回。Rust 的 `return` 语句可以用于提前返回。

<div class="comparison">

```cpp
#include <stdexcept>

double divide(double dividend, double divisor) {
  if (divisor == 0.0) {
    throw std::domain_error("zero divisor");
  }

  return dividend / divisor;
}
```

```rust
fn divide(
    dividend: f64,
    divisor: f64,
) -> Option<f64> {
    if divisor == 0.0 {
        return None;
    }

    Some(dividend / divisor)
}
```

</div>

要求返回类型指示可能出现错误，这意味着允许出错的回调需要给定 `Option` 或 `Result` 返回类型。省略这一点就像要求回调在 C++ 中必须是 `noexcept`。那些不需要指示错误但会被用作允许出错回调的函数，需要将其结果包装在 `Option::Some` 或 `Result::Ok` 中。

<div class="comparison">

```cpp
#include <stdexcept>

int produce_42() {
  return 42;
}

int fail() {
  throw std::runtime_error("oops");
}

int useCallback(int (*func)(void)) {
  return func();
}

int main() {
  try {
    int x = useCallback(produce_42);
    int y = useCallback(fail);

    // use x and y
  } catch (std::runtime_error &e) {
    // handle error
  }
}
```

```rust
fn produce_42() -> i32 {
    42
}

fn fail() -> Option<i32> {
    None
}

fn use_callback(
    f: impl Fn() -> Option<i32>,
) -> Option<i32> {
    f()
}

fn main() {
    // 需要包装 produce_42 以匹配
    // 期望的类型
    let Some(x) =
        use_callback(|| Some(produce_42()))
    else {
        // 处理错误
        return;
    };
    let Some(y) = use_callback(fail) else {
        // 处理错误
        return;
    };
    // 使用 x 和 y
}
```

</div>

## 错误处理

在 C++ 中，处理异常的唯一方式是 `catch`。在 Rust 中，所有用于处理[标记联合体](../data_modeling/tagged_unions.md)的特性都可以用于 `Result` 和 `Option`。具体采用哪种方式取决于程序的意图。

在 Rust 中处理 `Result` 指示的错误的基本方式是使用 `match`。

使用 `match` 是最通用的方法，因为它可以显式处理额外的情况，并且可以作为表达式使用。`match` 表示所有分支同等重要。

<div class="comparison">

```cpp
#include <vector>
#include <stdexcept>

int main() {
    std::vector<int> v;
    // ... 填充 v ...
    try {
        auto x = v.at(0);
        // 使用 x
    } catch (std::out_of_range &e) {
        // 处理错误
    }
}
```

```rust
fn main() {
    let mut v = Vec::<i32>::new();
    // ... 填充 v ...
    match v.get(0) {
        Some(x) => {
            // 使用 x
        }
        None => {
            // 处理错误
        }
    }
}
```

</div>

由于只处理 Rust 枚举的单一变体非常常见，`if let` 语法支持这种用法。该语法既清楚地表明只有这一种情况重要，又减少了缩进层级。

`if let` 不如 `match` 通用。它也可以作为表达式使用，但只能区分一种情况和其他情况。`if let` 表示 `else` 分支不是正常情况，而是会有一些默认处理或产生默认值。

注意，对于 `Result`，`if let` 不能访问错误值。

```rust
fn main() {
    let mut v = Vec::<i32>::new();
    // ... 填充 v ...
    if let Some(x) = v.get(0) {
        // 使用 x
    } else {
        // 处理错误
    }
}
```

当错误处理涉及某种控制流操作（如 `break` 或 `return`）时，`let else` 语法更为简洁。

与普通的 `let` 语句类似，`let else` 语句只能在需要语句的地方使用。`let else` 也表示 else 分支不是正常情况，并且不会有进一步的（正常）处理。

```rust
fn main() {
    let mut v = Vec::<i32>::new();
    // ... 填充 v ...
    let Some(x) = v.get(0) else {
        // 处理错误
        return;
    };
    // 使用 x
}
```

`Result` 和 `Option` 还有一些用于处理错误的辅助方法。这些方法类似于 C++ 中 `std::expected` 的方法。

<div class="comparison">

```cpp
#include <expected>
#include <string>

int main() {
  std::expected<int, std::string> res(42);
  auto x(res.transform([](int n) { return n * 2; }));
}
```

```rust
fn main() {
    let res: Result<i32, String> = Ok(42);
    let x = res.map(|n| n * 2);
}
```

</div>

这些辅助方法及其他内容在 [`Option`](https://doc.rust-lang.org/std/option/enum.Option.html#implementations) 和 [`Result`](https://doc.rust-lang.org/std/result/enum.Result.html#implementations) 的文档中有详细介绍。

## 借用的结果

在上面的例子中，成功的结果是从 vector 中借用的。通常需要将结果克隆或复制为拥有所有权的副本，并希望无需 match 和重构值即可完成。`Result` 和 `Option` 有辅助方法用于这些目的。

```rust
fn main() {
    let mut v = Vec::<i32>::new();
    v.push(42);
    let x: Option<&i32> = v.get(0);
    let y: Option<i32> = v.get(0).copied();

    let mut w = Vec::<String>::new();
    w.push("hello".to_string());
    let s: Option<&String> = w.get(0);
    let r: Option<String> = w.get(0).cloned();
}
```

## 错误传播

在 C++ 中，异常会自动传播。在 Rust 中，由 `Result` 或 `Option` 指示的错误必须显式传播。`?` 运算符为此提供了便利。还有一些用于操作 `Result` 和 `Option` 的方法，其效果类似于传播错误。

<div class="comparison">

```cpp
#include <cstddef>
#include <vector>

int accessValue(std::vector<std::size_t> indices,
                 std::vector<int> values,
                 std::size_t i) {
  // vector::at 抛出异常
  size_t idx(indices.at(i));
  // vector::at 抛出异常
  return values.at(idx);
}
```

```rust
fn access_value(
    indices: Vec<usize>,
    values: Vec<i32>,
    i: usize,
) -> Option<i32> {
    // * 解引用 &i32 以复制
    // ? 传播 None
    let idx = *indices.get(i)?;
    // 直接返回 Option
    values.get(idx).copied()
}
```

</div>

上面的 Rust 示例等价于下面这个没有使用 `?` 运算符的版本。使用 `?` 的版本更符合惯用写法。

```rust
fn access_value(
    indices: Vec<usize>,
    values: Vec<i32>,
    i: usize,
) -> Option<i32> {
    // 通过 & 匹配并复制 i32
    let Some(&idx) = indices.get(i) else {
        return None;
    };
    // 仍然直接返回 Option
    values.get(idx).copied()
}
```

下面的例子也是等价的。虽然不太惯用（这里用 `?` 更易读），但演示了一个辅助方法。`Option::and_then` 类似于 [C++23 中的 `std::optional::and_then`](https://en.cppreference.com/w/cpp/utility/optional/and_then)。

```rust
fn access_value(
    indices: Vec<usize>,
    values: Vec<i32>,
    i: usize,
) -> Option<i32> {
    // 通过 & 匹配并复制 i32
    indices
        .get(i)
        .and_then(|idx| values.get(*idx))
        .copied()
}
```

这些辅助方法及其他内容在 [`Option`](https://doc.rust-lang.org/std/option/enum.Option.html#implementations) 和 [`Result`](https://doc.rust-lang.org/std/result/enum.Result.html#implementations) 的文档中有详细介绍。

## `main` 中未捕获的异常

在 C++ 中，当异常未被捕获时，程序会以非零退出码和错误信息终止。要在 Rust 中用 `Result` 实现类似效果，可以让 `main` 返回 `Result` 类型。

<div class="comparison">

```cpp
#include <stdexcept>

int main() {
  throw std::runtime_error("oops");
}
```

```rust,ignore
fn main() -> Result<(), &'static str> {
    Err("oops")
}
```

</div>

结果类型必须是单元类型 `()`，错误类型可以是实现了 [`Debug` trait](https://doc.rust-lang.org/std/fmt/trait.Debug.html) 的任意类型。

```rust,no_run
#[derive(Debug)]
struct InterestingError {
    message: &'static str,
    other_interesting_value: i32,
}

fn main() -> Result<(), InterestingError> {
    Err(InterestingError {
        message: "oops",
        other_interesting_value: 9001,
    })
}
```

运行该程序会输出 `Error: InterestingError { message: "oops", other_interesting_value: 9001 }`，退出码为 `1`。

## 用 `Result` 强制错误处理的局限性

当与通过可变引用传递预分配缓冲区的 API 一起使用时，返回 `Result` 或 `Option` 并不能带来通常的好处。这是因为缓冲区在 `Result` 或 `Option` 之外也可访问，因此编译器无法强制处理错误情况。

例如，在下面的例子中，可以忽略 `read_line` 的结果，导致程序出现逻辑错误。但由于缓冲区必须被初始化，这不会导致内存安全问题或未定义行为。

```rust
fn main() {
    let mut buffer = String::with_capacity(1024);
    std::io::stdin().read_line(&mut buffer);
    // 使用 buffer
}
```

Rust 在这种情况下会发出警告，因为 `Result` 上有 [`#[must_use]` 属性](https://doc.rust-lang.org/reference/attributes/diagnostics.html#the-must_use-attribute)。

```text
warning: unused `Result` that must be used
 --> example.rs:3:5
  |
3 |     std::io::stdin().read_line(&mut buffer);
  |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  |
  = note: this `Result` may be an `Err` variant, which should be handled
  = note: `#[warn(unused_must_use)]` on by default
help: use `let _ = ...` to ignore the resulting value
  |
3 |     let _ = std::io::stdin().read_line(&mut buffer);
  |     +++++++
```

`Option` 没有 `#[must_use]` 属性，因此返回必须处理的 `Option`（因为 `None` 表示错误）的函数应加上 `#[must_use]` 属性。例如，切片的 `get` 方法返回 `Option`，并被[标注为 `#[must_use]`](https://doc.rust-lang.org/src/core/slice/mod.rs.html#592-595)。
