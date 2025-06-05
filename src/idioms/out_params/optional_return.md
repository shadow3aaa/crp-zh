# 可选返回值

在 C++ 中，一种用于可选地从方法或函数产生结果的惯用法是，使用引用参数配合布尔值或整数返回值来指示结果是否被产生。这样做的原因与[用于多返回值的 out 参数](./multiple_return.md)类似：

- 兼容早于 C++11 的 C++ 版本，
- 适用于采用 C 风格的 C++ 代码库，
- 性能方面的考虑。

Rust 中用于可选返回值的惯用做法是返回 [`Option`](https://doc.rust-lang.org/std/option/index.html) 类型的值。

<div class="comparison">

```cpp
#include <iostream>

bool safe_divide(unsigned int dividend,
                 unsigned int divisor,
                 unsigned int &quotient) {
  if (divisor != 0) {
    quotient = dividend / divisor;
    return true;
  } else {
    return false;
  }
}

void go(unsigned int dividend,
        unsigned int divisor) {
  unsigned int quotient;
  if (safe_divide(dividend, divisor, quotient)) {
    std::cout << quotient << std::endl;
  } else {
    std::cout << "Division failed!" << std::endl;
  }
}

int main() {
  go(10, 2);
  go(10, 0);
}
```

```rust
fn safe_divide(
    dividend: u32,
    divisor: u32,
) -> Option<u32> {
    if divisor != 0 {
        Some(dividend / divisor)
    } else {
        None
    }
}

fn go(dividend: u32, divisor: u32) {
    match safe_divide(dividend, divisor) {
        Some(quotient) => {
            println!("{}", quotient);
        }
        None => {
            println!("Division failed!");
        }
    }
}

fn main() {
    go(10, 2);
    go(10, 0);
}
```

</div>

当在失败情况下有有用的信息需要返回时，可以使用 [`Result` 类型](https://doc.rust-lang.org/std/result/)。详见[错误处理章节](../exceptions.md)对 `Result` 的介绍。

## 返回指针

当返回值是指针时，C++ 中的另一种常见惯用法是用 `nullptr` 表示可选情况。在 Rust 中，这一惯用法的对应实现也是用 `Option`，配合引用类型（如 `&` 或 `Box`）。详见[将 `nullptr` 作为哨兵值章节](../null/sentinel_values.md#nullptr)。

## 直接翻译的弊端

可以将使用 out 参数的原始示例直接翻译为 Rust，但这样得到的代码并不符合 Rust 的惯用风格。

```rust
// 非惯用 Rust
fn safe_divide(dividend: u32, divisor: u32, quotient: &mut u32) -> bool {
    if divisor != 0 {
        *quotient = dividend / divisor;
        true
    } else {
        false
    }
}

fn go(dividend: u32, divisor: u32) {
    let mut quotient: u32 = 0; // 初始化为任意值
    if safe_divide(dividend, divisor, &mut quotient) {
        println!("{}", quotient);
    } else {
        println!("Division failed!");
    }
}

fn main() {
    go(10, 2);
    go(10, 0);
}
```

这与[多返回值 out 参数直接翻译](./multiple_return.md#problems-with-the-direct-transliteration)存在相同的问题。

## C++17 及之后的相似做法

C++17 及之后版本提供了 `std::optional`，可以用来表达可选返回值，其用法与 Rust 的惯用示例类似。

```cpp
#include <iostream>
#include <optional>

std::optional<unsigned int> safe_divide(unsigned int dividend,
                                        unsigned int divisor) {
  if (divisor != 0) {
    return std::optional<unsigned int>(dividend / divisor);
  } else {
    return std::nullopt;
  }
}

void go(unsigned int dividend, unsigned int divisor) {
  if (auto quotient = safe_divide(dividend, divisor)) {
    std::cout << *quotient << std::endl;
  } else {
    std::cout << "Division failed!" << std::endl;
  }
}

int main() {
  go(10, 2);
  go(10, 0);
}
```

## 有用的 `Option` 工具方法

Rust 提供了多种语法糖来简化对返回 `Option` 的函数的使用。如果需要将失败情况传递给调用者，可以使用 `?` 运算符：

```rust
# fn safe_divide(dividend: u32, divisor: u32) -> Option<u32> {
#     if divisor != 0 {
#         Some(dividend / divisor)
#     } else {
#         None
#     }
# }
#
fn go(dividend: u32, divisor: u32) -> Option<()> {
    let quotient = safe_divide(dividend, divisor)?;
    println!("{}", quotient);
    Some(())
}
```

如果不需要传递 `None`，有时使用 [`let-else` 语法](https://doc.rust-lang.org/rust-by-example/flow_control/let_else.html)会更清晰：

```rust
# fn safe_divide(dividend: u32, divisor: u32) -> Option<u32> {
#     if divisor != 0 {
#         Some(dividend / divisor)
#     } else {
#         None
#     }
# }
#
fn go(dividend: u32, divisor: u32) {
    let Some(quotient) = safe_divide(dividend, divisor) else {
        println!("Division failed!");
        return;
    };
    println!("{}", quotient);
}
#
# fn main() {
#     go(10, 2);
#     go(10, 0);
# }
```

如果在 `None` 情况下需要使用默认值，可以使用
[`Option::unwrap_or`](https://doc.rust-lang.org/std/option/enum.Option.html#method.unwrap_or)、
[`Option::unwrap_or_else`](https://doc.rust-lang.org/std/option/enum.Option.html#method.unwrap_or_else)、
[`Option::unwrap_or_default`](https://doc.rust-lang.org/std/option/enum.Option.html#method.unwrap_or_default) 或
[`Option::unwrap`](https://doc.rust-lang.org/std/option/enum.Option.html#method.unwrap) 方法：

```rust
# fn safe_divide(dividend: u32, divisor: u32) -> Option<u32> {
#     if divisor != 0 {
#         Some(dividend / divisor)
#     } else {
#         None
#     }
# }
#
fn expensive_computation() -> u32 {
    // ...
#    0
}

fn go(dividend: u32, divisor: u32) {
    // 如果为 None，返回给定值。
    let result = safe_divide(dividend, divisor).unwrap_or(0);

    // 如果为 None，返回调用给定函数的结果。
    let result2 = safe_divide(dividend, divisor).unwrap_or_else(expensive_computation);

    // 如果为 None，返回 Default::default()，对于 u32 即为 0。
    let result3 = safe_divide(dividend, divisor).unwrap_or_default();

    // 如果为 None，panic。更推荐使用其他方法！
    // let result3 = safe_divide(dividend, divisor).unwrap();
}
#
# fn main() {
#     go(10, 2);
#     go(10, 0);
# }
```

在对性能敏感的代码中，如果你已经手动确保结果一定为 `Some`，可以使用
[`Option::unwrap_unchecked`](https://doc.rust-lang.org/std/option/enum.Option.html#method.unwrap_unchecked)，但这是一个不安全的方法。

还有[更多的工具方法](https://doc.rust-lang.org/std/option/#boolean-operators)可以简洁地处理 `Option` 值，详见本书[异常与错误处理章节](../exceptions.md)。

## 替代方案

Rust 中另一种返回可选值的方式是，要求函数调用者证明其传入的参数不会导致失败情况。

对于上述安全除法的例子，这意味着调用者要保证传入的除数不为零。如下例中通过动态检查实现。在其他场景下，所需的证明可能可以静态获得，由更上游的调用者提供，或被多次使用。在这些情况下，这种方式可以减少运行时开销和代码复杂度。

```rust
use std::convert::TryFrom;
use std::num::NonZero;

fn safe_divide(dividend: u32, divisor: NonZero<u32>) -> u32 {
    // 更高效，因为省略了溢出检查。
    dividend / divisor
}

fn go(dividend: u32, divisor: u32) {
    let Ok(safe_divisor) = NonZero::try_from(divisor) else {
        println!("Can't divide!");
        return;
    };

    let quotient = safe_divide(dividend, safe_divisor);
    println!("{}", quotient);
}

fn main() {
    go(10, 2);
    go(10, 0);
}
```

{{#quiz optional_return.toml}}
