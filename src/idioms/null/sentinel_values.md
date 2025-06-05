# 哨兵值

哨兵值是一种带内值，用于指示特殊情况，例如在迭代器中已到达有效数据的末尾。

## `nullptr`

C++ 中的许多设计借鉴了 C 的惯例，使用空指针作为返回拥有指针的方法的哨兵值。例如，一个解析大型结构的方法在失败时可能会返回 `std::nullptr`。

在 Rust 中，类似的情况会使用类型 `Option<Box<LargeStructure>>`。

<div class="comparison">

```cpp
#include <memory>

class LargeStructure {
  int field;
  // 还有许多字段 ...
};

std::unique_ptr<LargeStructure>
parse(char *data, size_t len) {
  // ...

  // 失败时
  return nullptr;
}
```

```rust
struct LargeStructure {
    field: i32,
    // 还有许多字段 ...
}

fn parse(
    data: &[u8],
) -> Option<Box<LargeStructure>> {
    // ...

    // 失败时
    None
}
```

</div>

`Box<T>` 类型与 `std::unique_ptr<T>` 的含义相同，都是对堆上某个 `T` 的唯一所有权指针，但与 `std::unique_ptr` 不同的是，`Box` 不能为 null。Rust 的 `Option<T>` 类似于 C++ 的 `std::optional<T>`，但它可以与指针和引用一起使用。在[这些情况（以及其他一些情况）](../data_modeling/template_specialization.md#niche-optimization)下，编译器会优化表示方式，使其与 `Box<T>` 的大小相同，利用了 `Box` 不能为 null 的事实。

在 Rust 中，也常常愿意多付出一个字节的代价，使用 `Result<T, E>`（类似于 C++23 的 `std::expected`）作为返回类型，以便在运行时提供失败原因。

## 整数哨兵

当一个可能失败的函数返回整数时，也常常使用一个未被使用或不太可能出现的整数值作为哨兵值，比如 `0` 或 `INT_MAX`。

在 Rust 中，`Option` 类型用于此目的。如果零值确实不可能出现，比如上面的最大公约数（gcd）算法，可以使用类型 `NonZero<T>` 来表示这一事实。与 `Option<Box<T>>` 类似，编译器会优化表示方式，利用未使用的值（此处为 `0`）来表示 `None`，从而保证 `Option<NonZero<T>>` 的表示与 `Option<T>` 相同。

<div class="comparison">

```cpp
#include <algorithm>

int gcd(int a, int b) {
  if (b == 0 || a == 0) {
    // 返回 0 表示输入无效
    return 0;
  }

  while (b != 0) {
    int temp = b;
    b = a % b;
    a = temp;
  }
  return std::abs(a);
}
```

```rust
use std::num::NonZero;

fn gcd(
    mut a: i32,
    mut b: i32,
) -> Option<NonZero<i32>> {
    if a == 0 || b == 0 {
        return None;
    }

    while b != 0 {
        let temp = b;
        b = a % b;
        a = temp;
    }
    // 此时 a 保证不为零。`NonZero::new` 的 `Some` 与本函数返回的 `Some` 含义不同，但此处恰好一致。
    NonZero::new(a.abs())
}
#
# fn main() {
#     assert!(gcd(5, 0) == None);
#     assert!(gcd(0, 5) == None);
#     assert!(gcd(5, 1) == NonZero::new(1));
#     assert!(gcd(1, 5) == NonZero::new(1));
#     assert!(gcd(2 * 2 * 3 * 5 * 7, 2 * 2 * 7 * 11) == NonZero::new(2 * 2 * 7));
#     assert!(gcd(2 * 2 * 7 * 11, 2 * 2 * 3 * 5 * 7) == NonZero::new(2 * 2 * 7));
# }
```

</div>

另外，也可以在不使用 unsafe Rust 的情况下，通过在算法中始终保持非零性，避免最后的冗余零值检查。

```rust
use std::num::NonZero;

fn gcd(x: i32, mut b: i32) -> Option<NonZero<i32>> {
    if b == 0 {
        return None;
    }

    // a 保证非零，因此用 NonZero 类型记录这一事实。
    let mut a = NonZero::new(x)?;

    while let Some(temp) = NonZero::new(b) {
        b = a.get() % b;
        a = temp;
    }
    Some(a.abs())
}
#
# fn main() {
#     assert!(gcd(5, 0) == None);
#     assert!(gcd(0, 5) == None);
#     assert!(gcd(5, 1) == NonZero::new(1));
#     assert!(gcd(1, 5) == NonZero::new(1));
#     assert!(gcd(2 * 2 * 3 * 5 * 7, 2 * 2 * 7 * 11) == NonZero::new(2 * 2 * 7));
#     assert!(gcd(2 * 2 * 7 * 11, 2 * 2 * 3 * 5 * 7) == NonZero::new(2 * 2 * 7));
# }
```

## `std::optional`

在 C++ 中使用 `std::optional` 作为哨兵值的场景下，Rust 可以用 `Option` 实现同样的目的。两者的主要区别在于，安全的 Rust 要求必须显式检查值是否为 `None`，而在 C++ 中可以在未检查的情况下尝试访问值（有导致未定义行为的风险）。

{{#quiz sentinel_values.toml}}
