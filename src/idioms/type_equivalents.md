# 类型等价

本文件中列出的类型等价关系，是针对在 Rust 中以类似 C++ 的方式编程时的等价性。它们不一定适用于通过 FFI 与 C 或 C++ 程序交互的场景。若需与 C 或 C++ 互操作的类型，请参阅 [Rust `std::ffi` 模块文档](https://doc.rust-lang.org/std/ffi/index.html) 以及 [Rustonomicon 中的 FFI 文档](https://doc.rust-lang.org/nomicon/ffi.html)。

## 基本类型

### 整数类型

在 C++ 中，许多整数类型（如 `int` 和 `long`）的宽度由实现定义。而在 Rust 中，整数类型总是带有明确的宽度，类似于 C++ 中 `<cstdint>` 里的类型。当不确定使用哪种整数类型时，[通常默认使用 `i32`，这也是 Rust 整数字面量的默认类型](https://doc.rust-lang.org/book/ch03-02-data-types.html#integer-types)。

| C++ 类型    | Rust 类型 |
|-------------|-----------|
| `uint8_t`   | `u8`      |
| `uint16_t`  | `u16`     |
| `uint32_t`  | `u32`     |
| `uint64_t`  | `u64`     |
| `int8_t`    | `i8`      |
| `int16_t`   | `i16`     |
| `int32_t`   | `i32`     |
| `int64_t`   | `i64`     |
| `size_t`    | `usize`   |
|             | `isize`   |

在 C++ 中，`size_t` 通常只用于表示大小和偏移量。Rust 中的 `usize` 也是指针宽度的整数类型，使用方式相同。`isize` 是 `usize` 的有符号对应类型，在 C++ 中没有直接等价类型，通常仅用于表示指针偏移。

### 浮点类型

与 C++ 中的整数类型类似，`float`、`double` 和 `long double` 的宽度由实现定义。C++23 引入了保证为特定位宽 IEEE 754 浮点数的类型，其中 `float32_t` 和 `float64_t` 分别对应通常的 `float` 和 `double`。Rust 的浮点类型与这些类似。

| C++ 类型      | Rust 类型 |
|---------------|-----------|
| `float16_t`   |           |
| `float32_t`   | `f32`     |
| `float64_t`   | `f64`     |
| `float128_t`  |           |

Rust 中与 `float16_t` 和 `float128_t` 对应的类型（`f16` 和 `f128`）[尚未在稳定版 Rust 中提供](https://github.com/rust-lang/rust/issues/116909)。

### 原始内存类型

在 C++ 中，`char`、`unsigned char` 或 `byte` 的指针或数组常用于表示原始内存。在 Rust 中，`[u8; N]` 数组、`Vec<u8>` 向量或 `&[u8]` 切片用于实现同样的目的。但以这种方式访问其他 Rust 值的底层内存需要使用 unsafe Rust。对于序列化或硬件交互等用途，有[相关库](../etc/libraries.md)可用于安全封装这类访问。

### 字符与字符串类型

C++ 的 `char` 或 `wchar_t` 类型宽度由实现定义。Rust 没有直接等价的类型。在 Rust 中处理字符串编码时，通常用无符号整数类型来代替 C++ 中的定宽字符类型。

| C++ 类型    | Rust 类型 |
|-------------|-----------|
| `char8_t`   | `u8`      |
| `char16_t`  | `u16`     |

Rust 的 `char` 类型表示一个 Unicode 标量值，因此其大小等同于 `u32`。在 Rust 字符串（保证为有效 UTF-8）中处理字符时，`char` 类型是合适的选择。若需表示字节，则应使用 `u8`。

Rust 标准库包含用于 UTF-8 字符串和字符串切片的类型：`String` 和 `&str`。这两种类型都保证字符串为有效的 UTF-8。`char` 类型适合用于表示 `String` 的元素。

由于 `str`（不带引用）是切片类型，因此本身是无大小的，必须通过引用或 Box 等指针类型使用。因此文档中常用 `&str` 表示字符串切片，尽管也可以用 `Box<str>`、`Rc<str>` 等。

Rust 还包含用于平台相关字符串表示及其切片的类型：[`std::ffi::OsString`](https://doc.rust-lang.org/std/ffi/struct.OsString.html) 和 `&std::ffi::OsStr`。这些字符串采用操作系统特定的表示方式，但若要与 Rust FFI 一起使用，仍需转换为 [`CString`](https://doc.rust-lang.org/std/ffi/struct.CString.html)。

与 C++ 的 `std::u16string` 不同，Rust 没有专门的 UTF-16 字符串类型。可以使用 `Vec<u16>`，但该类型无法保证内容为有效的 UTF-16 字符串。Rust 提供了将 `String` 与 UTF-16 编码互转的机制（[`String::encode_utf16`](https://doc.rust-lang.org/std/string/struct.String.html#method.encode_utf16) 和 [`String::from_utf16`](https://doc.rust-lang.org/std/string/struct.String.html#method.from_utf16) 等），也有类似机制用于访问底层 UTF-8 编码（https://doc.rust-lang.org/std/string/struct.String.html#method.from_utf8）。

| 用途               | Rust 类型                              |
|--------------------|----------------------------------------|
| 表示文本           | `String` 和 `&str`                     |
| 表示字节           | `u8` 的向量、数组或切片                |
| 与操作系统交互     | `OsString` 和 `&OsStr`                 |
| 表示 UTF-8         | `String`                               |
| 表示 UTF-16        | 使用[相关库](../etc/libraries.md)      |

### 布尔类型

Rust 的 `bool` 类型与 C++ 的 `bool` 类型类似。但与 C++ 不同，Rust [对 `bool` 类型的大小、对齐和位模式有明确保证](https://doc.rust-lang.org/reference/types/boolean.html)。

### `void`

在 C++ 中，`void` 表示函数不返回值。由于 Rust 是表达式导向的，所有函数都有返回值。Rust 用单元类型 `()` 代替 `void`。当函数未声明返回类型时，默认返回 `()`。

<div class="comparison">

```cpp
#include <iostream>

void process() {
    std::cout
        << "Does something, but returns nothing."
        << std::endl;
}
```

```rust
fn process() {
    println!("Does something but returns nothing.");
}
```

</div>

由于单元类型只有一个值（也写作 `()`），该类型的值不携带任何信息。因此返回值可以省略，如上例所示。如下例则显式使用了单元类型：

```rust
fn process() -> () {
    let () = println!("Does something but returns nothing.");
    ()
}
```

单元类型的语法和单元值的语法类似于空元组，本质上它就是这样一种类型。下面的例子展示了一些等价类型，但没有特殊语法或语言集成：

```rust
struct Pair<T1, T2>(T1, T2); // 等价于 (T1, T2)
struct Single<T>(T); // 只有一个值的元组 (T1)
struct Unit; // 等价于 ()
             // 也可以写作 struct Unit();
fn main() {
    let pair = Pair(1,2.0);
    let single = Single(1);
    let unit = Unit;
    // 也可以写作 let unit = Unit();
}
```

用单元类型代替 `void`，使得返回单元类型的表达式（如 C++ 中返回 `void` 的函数调用）可以在需要值的上下文中使用。这对于定义和使用泛型函数尤其有用，无需像 `std::is_void` 那样对 `void` 类型做特殊处理。

## 指针

下表将 C++ 的所有权管理类与 Rust 中的等价类型进行了对应。

| 用途                                               | C++ 类型                         | Rust 类型                                                                                                                                                                    |
|----------------------------------------------------|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 拥有所有权                                         | `T`                              | `T`                                                                                                                                                                          |
| 单一所有者，动态存储                               | `std::unique_ptr<T>`             | `Box<T>`                                                                                                                                                                     |
| 共享所有者，动态存储，不可变，非线程安全           | `std::shared_ptr<T>`             | `std::rc::Rc<T>`                                                                                                                                                             |
| 共享所有者，动态存储，不可变，线程安全             | `std::shared_ptr<T>`             | `std::sync::Arc<T>`                                                                                                                                                          |
| 共享所有者，动态存储，可变，非线程安全             | `std::shared_ptr<T>`             | [`std::rc::Rc<std::cell::RefCell<T>>`](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html#having-multiple-owners-of-mutable-data-by-combining-rct-and-refcellt) |
| 共享所有者，动态存储，可变，线程安全               | `std::shared_ptr<std::mutex<T>>` | [`std::sync::Arc<std::mutex::Mutex<T>>`](https://doc.rust-lang.org/book/ch16-03-shared-state.html)                                                                           |
| 常量引用                                           | `const &T`                       | `&T`                                                                                                                                                                         |
| 可变引用                                           | `&T`                             | `&mut T`                                                                                                                                                                     |
| 常量观察指针                                       | `const *T`                       | `&T`                                                                                                                                                                         |
| 可变观察指针                                       | `*T`                             | `&mut T`                                                                                                                                                                     |

在 C++ 中，`std::shared_ptr` 的线程安全性比表格中所示更为复杂（例如某些用法可能需要 `std::atomic`）。但在安全的 Rust 中，编译器会阻止对共享所有权类型的不正确使用。

与 C++ 引用不同，Rust 可以有引用的引用。Rust 的引用更像观察指针，而不是 C++ 的引用。

### `void*`

Rust 没有与 C++ 的 `void*` 直接对应的类型。关于动态类型的场景将在后续的 `RTTI` 章节中介绍。关于与 C 程序互操作时 `void*` 的用法，可参见 [Rustonomicon 的 FFI 章节](https://doc.rust-lang.org/nomicon/ffi.html#representing-opaque-structs)。

## 容器

C++ 和 Rust 的容器都拥有其元素。但在两者中，元素类型都可以是非拥有类型，如 C++ 中的指针或 Rust 中的引用。

| C++ 类型                   | Rust 类型                                                                                             |
|----------------------------|-------------------------------------------------------------------------------------------------------|
| `std::vector<T>`           | [`Vec<T>`](https://doc.rust-lang.org/std/vec/struct.Vec.html)                                         |
| `std::array<T, N>`         | [`[T; N]`](https://doc.rust-lang.org/std/primitive.array.html)                                        |
| `std::list<T>`             | [`std::collections::LinkedList<T>`](https://doc.rust-lang.org/std/collections/struct.LinkedList.html) |
| `std::queue<T>`            | [`std::collections::VecDeque<T>`](https://doc.rust-lang.org/std/collections/struct.VecDeque.html)     |
| `std::deque<T>`            | [`std::collections::VecDeque<T>`](https://doc.rust-lang.org/std/collections/struct.VecDeque.html)     |
| `std::stack<T>`            | [`Vec<T>`](https://doc.rust-lang.org/std/vec/struct.Vec.html)                                         |
| `std::map<K,V>`            | [`std::collections::BTreeMap<K,V>`](https://doc.rust-lang.org/std/collections/struct.BTreeMap.html)   |
| `std::unordered_map<K,V>`  | [`std::collections::HashMap<K,V>`](https://doc.rust-lang.org/std/collections/struct.HashMap.html)     |
| `std::set<K>`              | [`std::collections::BTreeSet<K>`](https://doc.rust-lang.org/std/collections/struct.BTreeSet.html)     |
| `std::unordered_set<K>`    | [`std::collections::HashSet<K>`](https://doc.rust-lang.org/std/collections/struct.HashSet.html)       |
| `std::priority_queue<T>`   | [`std::collections::BinaryHeap<T>`](https://doc.rust-lang.org/std/collections/struct.BinaryHeap.html) |
| `std::span<T>`             | [`&[T]`](https://doc.rust-lang.org/std/primitive.slice.html)                                          |

对于映射和集合，容器类型不再通过哈希或比较函数参数化，而是要求键类型实现 `std::hash::Hash`（无序）或 `std::cmp::Ord`（有序） trait。若需使用不同哈希或比较函数，需用包装类型实现所需 trait。

C++ STL 提供的一些容器类型在 Rust 中没有等价物，但许多可以通过第三方[库](../etc/libraries.md)获得。

C++ 与 Rust 在这些类型的使用上有一个显著区别：Rust 的 `Vec<T>` 和数组 `[T; N]` 可以方便地创建切片引用 `&[T]` 或 `&mut [T]`，用于部分或全部数据。因此，定义不修改向量长度且不需静态知道数组元素数量的函数时，更惯用的做法是将参数类型设为 `&[T]` 或 `&mut [T]`，而不是对拥有类型的引用。

在 C++ 中，若可能，最好传递起止迭代器而不是 `span`，因为迭代器更通用。Rust 也是如此，优先接受实现了 `IntoIter<&T>` 或 `IntoIter<&mut T>` 的泛型类型，而不是 `&[T]`。

<div class="comparison">

```c++
#include <iterator>
#include <vector>

template <typename InputIter>
void go(InputIter first, InputIter last) {
  for (auto it = first; it != last; ++it) {
    // ...
  }
}

int main() {
  std::vector<int> v = {1, 2, 3};
  go(v.begin(), v.end());
}
```

```rust
use std::iter::IntoIterator;

fn go<'a>(iter: impl IntoIterator<Item = &'a mut i32>) {
    for x in iter {
        // ...
    }
}

fn main() {
    let mut v = vec![1, 2, 3];
    go(&mut v);
}
```

</div>

{{#quiz type_equivalents.toml}}
