# 类型提升与转换

## 左值到右值

在 C++ 中，左值在需要时会自动转换为右值。

在 Rust 中，左值的等价物是“位置表达式”（表示内存位置的表达式），右值的等价物是“值表达式”。位置表达式在需要时会自动转换为值表达式。

<div class="comparison">

```cpp
int main() {
  // 局部变量是左值，
  int x(0);
  // 因此可以被赋值。
  x = 42;

  // x 在需要时会被转换为左值。
  int y = x + 1;
}
```

```rust
fn main() {
    // 局部变量是位置表达式，
    let mut x = 0;
    // 因此可以被赋值。
    x = 42;

    // x 在需要时会被转换为值表达式。
    let y = x + 1;
}
```

</div>

## 数组到指针

在 C++ 中，数组会在需要时自动转换为指针。

在 Rust 中，与此等价的是 vector 和数组的引用会自动转换为切片引用。

<div class="comparison">

```cpp
#include <cstring>

int main() {
  char example[6] = "hello";
  char other[6];

  // strncpy 的参数类型为 char*
  strncpy(other, example, 6);
}
```

```rust
fn third(ts: &[char]) -> Option<&char> {
    ts.get(2)
}

fn main() {
    let vec: Vec<char> = vec!['a', 'b', 'c'];
    let arr: [char; 3] = ['a', 'b', 'c'];

    third(&vec);
    third(&arr);
}
```

</div>

由于切片引用可以安全地用于内存操作，Rust 通常推荐以切片引用作为函数参数，而不是 vector 或数组引用，除非需要特定于 vector 或数组的功能。

与 C++ 中数组到指针的转换是语言内建机制不同，Rust 这是由 [`Deref` trait](https://doc.rust-lang.org/std/ops/trait.Deref.html) 提供的一般机制，这也是一种[用户自定义转换](./user-defined_conversions.md)。

## 函数到指针

在 C++ 中，函数和静态成员函数会自动转换为函数指针。

Rust 也有类似的转换。除了不带 `self` 参数的函数和成员外，构造函数（真正的构造函数）也具有函数类型，可以转换为函数指针。非捕获闭包虽然没有函数类型，但也可以转换为函数指针。

<div class="comparison">

```cpp
int twice(int n) {
  return n * n;
}

struct MyPair {
  int x;
  int y;

  MyPair(int x, int y) : x(x), y(y) {}

  static MyPair make() {
    return MyPair{0, 0};
  }
};

int main() {
  // 函数转换为函数指针
  int (*twicePtr)(int) = twice;
  int result = twicePtr(5);

  // C++23 11.4.5.1.6，不允许获取构造函数的地址
  // MyPair (*ctor)(int, int) = MyPair::MyPair;
  // MyPair pair = ctor(10, 20);

  // 静态方法转换为函数指针
  MyPair (*methodPtr)() = MyPair::make;
  MyPair pair2 = methodPtr();

  // 非捕获闭包转换为函数指针
  int (*closure)(int) = [](int x) -> int {
    return x * 5;
  };
  int closureRes = closure(2);
}
```

```rust
fn twice(x: i32) -> i32 {
    x * x
}

struct MyPair(i32, i32);

impl MyPair {
    fn new() -> MyPair {
        MyPair(0, 0)
    }
}

fn main() {
    // 函数转换为函数指针
    let twicePtr: fn(i32) -> i32 = twice;
    let res = twicePtr(5);

    // 构造函数转换为函数指针
    let ctorPtr: fn(i32, i32) -> MyPair = MyPair;
    let pair = ctorPtr(10, 20);

    // 静态方法转换为函数指针
    let methodPtr: fn() -> MyPair = MyPair::new;
    let pair2 = methodPtr();

    // 非捕获闭包转换为函数指针
    let closure: fn(i32) -> i32 = |x: i32| x * 5;
    let closureRes = closure(2);
}
```

</div>

## 数值提升与数值转换

在 C++ 中，数值类型之间存在多种隐式转换。最常见的是数值提升，将数值类型转换为更大的类型。

这些无损转换在 Rust 中不是隐式的，必须显式调用 `Into::into()` 方法。这些转换由 [`From`](https://doc.rust-lang.org/std/convert/trait.From.html) 和 [`Into`](https://doc.rust-lang.org/std/convert/trait.Into.html) trait 的实现提供。标准库支持的转换列表可在 [文档页面](https://doc.rust-lang.org/std/convert/trait.From.html#implementors) 查阅。

<div class="comparison">

```cpp
int main() {
  int x(42);
  long y = x;

  float a(1.0);
  double b = a;
}
```

```rust
fn main() {
    let x: i32 = 42;
    let y: i64 = x.into();

    let a: f32 = 1.0;
    let b: f64 = a.into();
}
```

</div>

C++ 中还有一些非无损的隐式转换。例如，整数可以隐式转换为无符号整数。

在 Rust 中，这些转换也必须显式进行，通常通过 [`TryFrom`](https://doc.rust-lang.org/std/convert/trait.TryFrom.html) 和 [`TryInto`](https://doc.rust-lang.org/std/convert/trait.TryInto.html) trait 实现，需要处理无法转换的情况。

<div class="comparison">

```cpp
int main() {
  int x(42);
  unsigned int y(x);

  float a(1.0);
  double b(a);
}
```

```rust
use std::convert::TryInto;

fn main() {
    let x: i32 = 42;
    let y: u32 = match x.try_into() {
        Ok(x) => x,
        Err(err) => {
            panic!("无法转换！{:?}", err);
        }
    };
}
```

</div>

有些 C++ 中的转换既不被 `From` 也不被 `TryFrom` 支持，因为没有明确的转换方式，或者不是值保持的。例如，C++ 中 `int32_t` 可以隐式转换为 `float`，但 `float` 并不能精确表示所有 32 位整数，而 Rust 没有 `TryFrom<i32>` 到 `f32` 的实现。

在 Rust 中，`i32` 到 `f32` 的转换只能通过 [`as` 运算符](https://doc.rust-lang.org/stable/reference/expressions/operator-expr.html#r-expr.as.coercions) 实现。该运算符也可用于其他原始类型之间的转换，不会 panic 或产生未定义行为，但可能不会按预期方式转换（如舍入方式不同或截断而非饱和）。

<div class="comparison">

```cpp
#include <cstdint>

int main() {
  int32_t x(42);
  float a = x;
}
```

```rust
fn main() {
    let x: i32 = 42;
    let a: f32 = x as f32;
}
```

</div>

### `isize` 和 `usize`

Rust 标准库中的 `isize` 和 `usize` 类型用于索引（类似于 C++ 的 `size_t`）。但在其他场景下，通常建议使用显式大小的类型如 `u32`。这导致 `u32` 类型的值在用作索引时需要转换为 `usize`，但标准库并未为 `u32` 实现 `Into<usize>`。

此时，最佳实践是使用 `TryInto`，如果不需要进一步处理错误，可以调用 `unwrap`，在转换失败时 panic。

这样做可以避免错误值继续传播。例如，将 `u64` 转换为 32 位的 `usize` 时，`as` 会截断结果，`u32::MAX + 1` 会变成 `0`，可能导致错误地访问数据结构，掩盖 bug 并产生意外行为。

### 枚举

C++ 中枚举可以隐式转换为整数类型。

Rust 中需要使用 `as` 运算符进行转换，建议实现 `From` 和 `TryFrom` 以便在枚举和其表示类型之间转换。更多示例和细节见[枚举章节](./data_modeling/enums.md)。

## 限定符转换

C++ 中限定符转换允许在需要非 const（或 volatile）限定符的地方使用 const（或 volatile）值。

Rust 中的等价机制允许 `mut` 变量和 `mut` 引用在需要非 `mut` 变量或引用的地方使用。

<div class="comparison">

```cpp
#include <iostream>
#include <string>

void display(const std::string &msg) {
  std::cout << "Displaying: " << msg << std::endl;
}

int main() {
  // 无 const 限定符
  std::string message("hello world");

  // 用于需要 const 的地方
  display(message);
}
```

```rust
fn display(msg: &str) {
    println!("{}", msg);
}

fn main() {
    let mut s: String = "hello world".to_string();
    let message: &mut str = s.as_mut();
    display(message);
}
```

</div>

## 整数字面量

C++ 中没有类型后缀的整数字面量会选择能容纳它的最小类型（`int`、`long int` 或 `long long int`）。当字面量赋值给不同类型的变量时，会发生隐式转换。

Rust 中，整数字面量的类型由上下文推断。当无法推断类型时，默认使用 `i32`，或者需要显式类型标注。

<div class="comparison">

```cpp
#include <cstdint>
#include <iostream>

int main() {
  // 编译不会报错（但有警告）。
  uint32_t x = 4294967296;

  // 默认 int
  auto y = 1;

  // 字面量被赋予更大类型，能正确输出
  std::cout << 4294967296 << std::endl;

  // 这些也能正常工作
  std::cout << INT64_C(4294967296) << std::endl;

  uint64_t z = INT64_C(4294967296);
  std::cout << z << std::endl;
}
```

```rust
fn main() {
    // 错误：字面量超出 `u32` 范围
    // let x: u32 = 4294967296;

    // 默认 i32
    let y = 1;

    // 编译失败，因为被推断为 i32
    // print!("{}", 4294967296);

    // 这样可以
    println!("{}", 4294967296u64);

    let z: u64 = 4294967296;
    println!("{}", z);
}
```

</div>

## 安全布尔

安全布尔惯用法用于让类型可以作为条件表达式使用。自 C++11 起，这一惯用法实现起来很直接。

Rust 中通常不是将值转换为布尔类型，而是直接对值进行匹配。根据场景，可以使用 `match`、`if let` 或 `let else`。

<div class="comparison">

```cpp
struct Wire {
  bool ready;
  unsigned int value;

  explicit operator bool() const { return ready; }
};

int main() {
  Wire w{false, 0};
  // ...

  if (w) {
    // 使用 w.value
  } else {
    // 其他处理
  }
}
```

```rust
enum Wire {
    Ready(u32),
    NotReady,
}

fn main() {
    let wire = Wire::NotReady;
    // ...

    // match
    match wire {
        Wire::Ready(v) => {
            // 使用值 v
        }
        Wire::NotReady => {
            // 其他处理
        }
    }

    // if let
    if let Wire::Ready(v) = wire {
        // 使用值 v
    }

    // let else
    let Wire::Ready(v) = wire else {
        // 做一些不能继续的操作，比如提前返回
        return;
    };
}
```

</div>

## 用户自定义转换

用户自定义转换在[单独章节](./user-defined_conversions.md)中介绍。

{{#quiz promotions_and_conversions.toml}}
