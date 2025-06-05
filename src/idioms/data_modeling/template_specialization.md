# 模板特化

C++ 中的模板特化使模板实体能够针对不同的参数拥有不同的实现。大多数 STL 实现都利用了这一点，例如为 [`std::vector<bool>` 提供空间高效的表示](https://en.cppreference.com/w/cpp/container/vector_bool)。

由于模板特化的存在，当 C++ 函数操作如 `std::vector` 这样的模板类的值时，函数实际上是基于模板类所提供的接口来定义的，而不是针对某个特定实现。

要在 Rust 中实现类似的功能，需要基于 trait（特征）来定义函数接口。这样，用户可以通过使用任何实现了该接口的具体类型，自由选择数据的具体表示方式。

由于 Rust 的泛型并不是一种通用的元编程工具，因此[泛型实体可以在本地进行类型检查](./templates.md#a-note-on-type-checking-and-type-errors)，这使得它们更容易定义。这种做法在 Rust 中比在 C++ 中更常见，因为 Rust 没有[实现继承](./inheritance_and_reuse.md)，所以接口与实现之间的界限比 C++ 更加清晰。

下面的例子展示了如何在 Rust 中实现一个函数，使得用户可以选择不同的具体数据表示。为了实现紧凑的位向量表示，示例中使用了 [bitvec crate](https://docs.rs/bitvec/latest/bitvec/) 的 [`BitVec`](https://docs.rs/bitvec/latest/bitvec/vec/struct.BitVec.html) 类型。`BitVec` 旨在提供类似于 `Vec<bool>` 或 `std::vector<bool>` 的 API。

<div class="comparison">

```cpp
#include <string>
#include <vector>

template <typename T>
void push_if_even(int n,
                  std::vector<T> &collection,
                  T item) {
  if (n % 2 == 0) {
    collection.push_back(item);
  }
}

int main() {
  // 操作默认的 std::vector 实现
  std::vector<std::string> v{"a", "b"};
  push_if_even(2, v, std::string("c"));

  // 操作（可能经过空间优化的）std::vector 实现
  std::vector<bool> bv{false, true};
  push_if_even(2, bv, false);
}
```

```rust,ignore
// Extend trait 用于支持向集合追加值的类型。
fn push_if_even<T, I: Extend<T>>(
    n: u32,
    collection: &mut I,
    item: T,
) {
    if n % 2 == 0 {
        collection.extend([item]);
    }
}

use bitvec::prelude::*;

fn main() {
    // 操作 Vec
    let mut v =
        vec!["a".to_string(), "b".to_string()];
    push_if_even(2, &mut v, "c".to_string());

    // 操作 BitVec
    let mut bv = bitvec![0, 1];
    push_if_even(2, &mut bv, 0);
}
```

</div>

## 泛型与模板的权衡

由于泛型函数只能以 trait bound（特征约束）所定义的方式与泛型值交互，因此测试泛型实现更加容易。特别是，测试泛型实现的代码只需考虑给定 trait 的可能行为。

作为对比，请看下面的程序。

<div class="comparison">

```cpp
template <totally_ordered T>
T max(const T &x, const T &y) {
  return (x > y) ? x : y;
}

template <>
int max(const int &x, const int &y) {
  return (x > y) ? x + 1 : y + 1;
}
```

```rust
fn max<'a, T: Ord>(x: &'a T, y: &'a T) -> &'a T {
    if x > y {
        x
    } else {
        y
    }
}
```

</div>

在 Rust 程序中，_参数多态性_ 意味着（假设是安全的 Rust）仅从类型就可以推断出，如果函数返回，它一定会返回 `x` 或 `y` 其中之一。这是因为 `Ord` trait bound 并没有提供构造新类型 `T` 值的方法，而引用的使用也不允许函数在后续调用中返回之前调用的 `x` 或 `y`。

在 C++ 程序中，当以 `int` 作为模板参数调用 `max` 时，由于模板特化，函数的行为会与其他参数类型有明显不同。

这种权衡在于，Rust 中的特化实现更难使用，因为它们必须有不同的名字，但泛型代码更容易编写且更容易保证其正确性。

## 利基优化

在某些情况下，Rust 编译器会进行优化，以实现更高效的表示。这些情况都是在效率提升不会改变代码可观察行为的前提下进行的。

[最常见的例子是 `Option` 类型](https://doc.rust-lang.org/std/option/index.html#representation)。当 `Option` 用于编译器能够判断有未使用值的类型时，其中一个未使用的值会被用来表示 `None`，这样 `Option<T>` 就不需要额外的内存来存储枚举的判别值。

这种优化会应用于引用类型（`&` 和 `&mut`），因为引用不能为 null。它也会应用于 `NonNull<T>`（表示非空指针）以及 `NonZeroU8` 等非零整数类型。对引用类型的优化使得 `Option<&T>` 和 `Option<&mut T>` 成为 C++ 中非拥有型观察指针的更安全替代方案。

{{#quiz template_specialization.toml}}
