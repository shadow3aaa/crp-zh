# 用户自定义类型转换

在 C++ 中，用户自定义类型转换可以通过[转换构造函数](https://en.cppreference.com/w/cpp/language/converting_constructor)或[转换函数](https://en.cppreference.com/w/cpp/language/cast_operator)实现。由于转换构造函数默认是隐式的（可通过 `explicit` 关键字禁用），因此在 C++ 代码中隐式转换经常发生。如下例中，赋值和函数调用都利用了转换构造函数提供的隐式转换。

Rust 极少使用隐式转换，大多数转换都是显式的。[`std::convert`](https://doc.rust-lang.org/std/convert/index.html) 模块为用户自定义转换提供了多个 trait。在 Rust 中，下例通过实现 [`From` trait](https://doc.rust-lang.org/std/convert/trait.From.html)来实现显式转换。

<div class="comparison">

```cpp
struct Widget {
  Widget(int) {}
  Widget(int, int) {}
};

void process(Widget w) {}

int main() {
  Widget w1 = 1;
  Widget w2 = {4, 5};
  process(1);
  process({4, 5});

  return 0;
}
```

```rust
struct Widget;

impl From<i32> for Widget {
    fn from(_x: i32) -> Widget {
        Widget
    }
}

impl From<(i32, i32)> for Widget {
    fn from(_x: (i32, i32)) -> Widget {
        Widget
    }
}

fn process(w: Widget) {}

fn main() {
    let w1: Widget = 1.into();
    // 更符合习惯的写法：
    let w1b = Widget::from(1);

    let w2: Widget = (4, 5).into();
    // 更符合习惯的写法：
    let w2b = Widget::from((4, 5));

    process(1.into());
    process((4, 5).into());
}
```

</div>

上例中的 `into` 方法是通过 [`Into trait`](https://doc.rust-lang.org/std/convert/trait.Into.html) 的[通用实现](https://doc.rust-lang.org/book/ch10-02-traits.html#using-trait-bounds-to-conditionally-implement-methods)提供的，只要类型实现了 `From` trait。由于有[通用实现](https://doc.rust-lang.org/std/convert/trait.Into.html#impl-Into%3CU%3E-for-T)，通常推荐只实现 `From` trait，而让 `Into` trait 由通用实现自动提供。

## 转换函数

C++ 的转换函数支持将自定义类型转换为其他类型。

在 Rust 中，可以反向实现 `From` trait 来达到同样的目的。实现 trait 时，源类型或目标类型至少有一个必须定义在当前 crate 中。

<div class="comparison">

```cpp
#include <utility>

struct Point {
  int x;
  int y;

  operator std::pair<int, int>() const {
    return std::pair(x, y);
  }
};

void process(std::pair<int, int>) {}

int main() {
  Point p1{1, 2};
  Point p2{3, 4};

  std::pair<int, int> xy = p1;
  process(p2);

  return 0;
}
```

```rust
struct Point {
    x: i32,
    y: i32,
}

impl From<Point> for (i32, i32) {
    fn from(p: Point) -> (i32, i32) {
        (p.x, p.y)
    }
}

fn process(x: (i32, i32)) {}

fn main() {
    let p1 = Point { x: 1, y: 2 };
    let p2 = Point { x: 3, y: 4 };

    let xy: (i32, i32) = p1.into();
    process(p2.into());
}
```

</div>

转换函数在 C++ 中常用于实现 safe bool 模式，[而在 Rust 中有不同的处理方式](./promotions_and_conversions.md#safe-bools)。

## 借用转换

`From` 和 `Into` trait 的方法会取得被转换值的所有权。在 C++ 中，如果不希望转移所有权，可以让转换函数接收和返回引用。

在 Rust 中，可以使用 [`AsRef` trait](https://doc.rust-lang.org/std/convert/trait.AsRef.html) 或 [`AsMut` trait](https://doc.rust-lang.org/std/convert/trait.AsMut.html) 实现类似功能。

<div class="comparison">

```cpp
#include <iostream>
#include <string>

struct Person {
  std::string name;

  operator std::string &() {
    return this->name;
  }
};

void process(const std::string &name) {
  std::cout << name << std::endl;
}

int main() {
  Person alice{"Alice"};

  process(alice);

  return 0;
}
```

```rust
struct Person {
    name: String,
}

impl AsRef<str> for Person {
    fn as_ref(&self) -> &str {
        &self.name
    }
}

fn process(name: &str) {
    println!("{}", name);
}

fn main() {
    let alice = Person {
        name: "Alice".to_string(),
    };

    process(alice.as_ref());
}
```

</div>

在函数定义中，常用 `AsRef` 或 `AsMut` 作为 trait bound。用泛型配合 `AsRef` 或 `AsMut`，可以让调用者传入任何可以高效视为目标类型的值。用这种技巧，上例中的 `process` 可以这样定义：

```rust
# struct Person {
#     name: String,
# }
#
# impl AsRef<str> for Person {
#     fn as_ref(&self) -> &str {
#         &self.name
#     }
# }
#
fn process<T: AsRef<str>>(name: T) {
    println!("{}", name.as_ref());
}

fn main() {
    let alice = Person {
        name: "Alice".to_string(),
    };

    process(alice);
}
```

这种技巧常用于处理文件路径的函数，使得字符串字面量也能方便地作为路径传递。

## 可失败的转换

在 C++ 中，如果转换可能失败，可以（虽然通常不推荐）在转换构造函数或转换函数中抛出异常。

Rust 的错误处理[不使用异常](./exceptions.md)。对于可失败的转换，使用 [`TryFrom` trait](https://doc.rust-lang.org/std/convert/trait.TryFrom.html) 和 [`TryInto` trait](https://doc.rust-lang.org/std/convert/trait.TryInto.html)。这两个 trait 与 `From` 和 `Into` 的区别在于它们返回 `Result`，可以表示失败情况。如果转换可能失败，应实现 `TryFrom`，并让调用者决定是否调用 `unwrap`，而不是在 `From` 实现中 panic。

<div class="comparison">

```cpp
#include <stdexcept>
#include <string>

class NonEmpty {
  std::string s;

public:
  NonEmpty(std::string s) : s(s) {
    if (this->s.empty()) {
      throw std::domain_error("empty string");
    }
  }
};

int main() {
  std::string s("");
  NonEmpty x = s; // throws

  return 0;
}
```

```rust
use std::convert::TryFrom;
use std::convert::TryInto;

struct NonEmpty {
    s: String,
}

#[derive(Clone, Copy, Debug)]
struct NonEmptyStringError;

impl TryFrom<String> for NonEmpty {
    type Error = NonEmptyStringError;

    fn try_from(
        s: String,
    ) -> Result<NonEmpty, NonEmptyStringError>
    {
        if s.is_empty() {
            Err(NonEmptyStringError)
        } else {
            Ok(NonEmpty { s })
        }
    }
}

fn main() {
    let res: Result<
        NonEmpty,
        NonEmptyStringError,
    > = "".to_string().try_into();
    match res {
        Ok(ne) => {
            println!("Converted!");
        }
        Err(err) => {
            println!("Couldn't convert");
        }
    }
}
```

</div>

与 `From` 和 `Into` 类似，[TryInto trait](https://doc.rust-lang.org/std/convert/trait.TryInto.html#impl-TryInto%3CU%3E-for-T) 也有通用实现，适用于所有实现了 `TryFrom` 的类型。

## 隐式转换

Rust 只有一种用户自定义的隐式转换，称为 [deref 强制转换](https://doc.rust-lang.org/std/ops/trait.Deref.html#deref-coercion)，由 [`Deref` trait](https://doc.rust-lang.org/std/ops/trait.Deref.html) 和 [`DerefMut` trait](https://doc.rust-lang.org/std/ops/trait.DerefMut.html) 提供。这种转换让指针类型的使用更加简洁。

在 Rust 官方书籍中有[实现自定义指针类型 deref 的示例](https://doc.rust-lang.org/book/ch15-02-deref.html)。

## 总结

关于各种转换接口的使用场景，可参考 [`std::convert` 模块](https://doc.rust-lang.org/std/convert/index.html)的文档。

{{#quiz user-defined_conversions.toml}}
