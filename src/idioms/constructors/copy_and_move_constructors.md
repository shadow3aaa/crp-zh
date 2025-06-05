# 拷贝与移动构造函数

在 C++ 和 Rust 中，通常很少需要手动编写拷贝或移动构造函数（或其 Rust 等价物）。在 C++ 中，这是因为隐式定义对于大多数用途已经足够，尤其是在使用智能指针时（即遵循[零规则](https://en.cppreference.com/w/cpp/language/rule_of_three)）。在 Rust 中，这是因为移动语义是默认的，并且自动派生的 `Clone` 和 `Copy` trait 实现对于大多数用途也已足够。

对于以下 C++ 类，隐式定义的拷贝和移动构造函数就已足够。Rust 中的等价实现使用标准库提供的 derive 宏来实现相应的 trait。

<div class="comparison">

```cpp
#include <memory>
#include <string>

struct Age {
  unsigned int years;

  Age(unsigned int years) : years(years) {}

  // 拷贝和移动构造函数及析构函数
  // 隐式声明和定义
};

struct Person {
  Age age;
  std::string name;
  std::shared_ptr<Person> best_friend;

  Person(Age age,
         std::string name,
         std::shared_ptr<Person> best_friend)
      : age(age), name(name),
        best_friend(best_friend) {}

  // 拷贝和移动构造函数及析构函数
  // 隐式声明和定义
};
```

```rust
use std::rc::Rc;

#[derive(Clone, Copy)]
struct Age {
    years: u32,
}

#[derive(Clone)]
struct Person {
    age: Age,
    name: String,
    best_friend: Rc<Person>,
}
```

</div>

## 用户自定义构造函数

另一方面，以下示例由于管理资源（从 C 库获取的指针），因此需要用户自定义的拷贝和移动构造函数。Rust 中的等价实现则需要自定义实现 `Clone` trait。

<div class="comparison">

```cpp
#include <cstdlib>
#include <cstring>

// widget.h
struct widget_t;
widget_t *alloc_widget();
void free_widget(widget_t *);
void copy_widget(widget_t *dst, widget_t *src);

// widget.cc
class Widget {
  widget_t *widget;

public:
  Widget() : widget(alloc_widget()) {}

  Widget(const Widget &other) : widget(alloc_widget()) {
    copy_widget(widget, other.widget);
  }

  Widget(Widget &&other) : widget(other.widget) {
    other.widget = nullptr;
  }

  ~Widget() {
    free_widget(widget);
  }
};
```

```rust
# mod example {
mod widget_ffi {
    // 模拟不透明类型。
    // 参考 https://doc.rust-lang.org/nomicon/ffi.html#representing-opaque-structs
    #[repr(C)]
    pub struct CWidget {
        _data: [u8; 0],
        _marker: core::marker::PhantomData<(
            *mut u8,
            core::marker::PhantomPinned,
        )>,
    }

    extern "C" {
        pub fn make_widget() -> *mut CWidget;
        pub fn copy_widget(
            dst: *mut CWidget,
            src: *mut CWidget,
        );
        pub fn free_widget(ptr: *mut CWidget);
    }
}

use self::widget_ffi::*;

struct Widget {
    widget: *mut CWidget,
}

impl Widget {
    fn new() -> Self {
        Widget {
            widget: unsafe { make_widget() },
        }
    }
}

impl Clone for Widget {
    fn clone(&self) -> Self {
        let widget = unsafe { make_widget() };
        unsafe {
            copy_widget(widget, self.widget);
        }
        Widget { widget }
    }
}

impl Drop for Widget {
    fn drop(&mut self) {
        unsafe { free_widget(self.widget) };
    }
}
# }
```

</div>

正如在 C++ 中很少需要为拷贝和移动构造函数或析构函数手动实现一样，在 Rust 中，对于不表示资源的类型，也很少需要手动实现 `Clone` 和 `Drop` trait。

有一个例外。如果类型有类型参数，即使克隆操作只是字段逐个克隆，有时也希望手动实现 `Clone`（和 `Copy`）。详情可参考 [标准库文档 `Clone`](https://doc.rust-lang.org/std/clone/trait.Clone.html#how-can-i-implement-clone) 和 [`Copy`](https://doc.rust-lang.org/std/marker/trait.Copy.html#how-can-i-implement-copy)。

## 可平凡拷贝类型

在 C++ 中，当一个类类型没有非平凡的拷贝构造函数、移动构造函数、拷贝赋值运算符、移动赋值运算符，并且拥有平凡的析构函数时，该类型被认为是可平凡拷贝的。可平凡拷贝类型的值可以通过字节拷贝来复制。

在上面的第一个 C++ 示例中，`Age` 是可平凡拷贝的，但 `Person` 不是。这是因为虽然 `Person` 使用了默认的拷贝构造函数，但由于 `std::string` 和 `std::shared_ptr` 不是可平凡拷贝的，所以其构造函数也不是平凡的。

Rust 通过 `Copy` trait 来标识类型是否可平凡拷贝。与 C++ 中的可平凡拷贝类型类似，实现了 `Copy` trait 的 Rust 类型的值可以通过字节拷贝来复制。对于未实现 `Copy` 的类型，Rust 需要显式调用 `clone` 方法来复制值。

在上面的第一个 Rust 示例中，`Age` 实现了 `Copy` trait，而 `Person` 没有。这是因为 `String` 和 `Rc<Person>` 都没有实现 `Copy`。它们没有实现 `Copy`，是因为它们拥有堆上的数据，因此不是可平凡拷贝的。

如果某个类型的字段中有任何一个不是 `Copy`，Rust 会阻止为该类型实现 `Copy`，但不会阻止为那些本不该按位拷贝的类型实现 `Copy`，这通常通过用户自定义的 `Clone` 实现来体现。

Rust 不允许同一个类型同时实现 `Copy` 和 `Drop`。这与 C++ 标准要求可平凡拷贝类型不能有用户自定义析构函数是一致的。

## 移动构造函数

在 Rust 中，所有类型默认都支持移动语义，且无法（也无需）自定义移动语义。这是因为 Rust 中的“移动”与 C++ 中的含义不同。在 Rust 中，移动一个值意味着改变其所有权。特别地，移动后不会有“旧”对象需要析构，因为编译器会阻止对已被移动的变量的使用。

## 赋值运算符

Rust 没有拷贝或移动赋值运算符。赋值操作要么是移动（转移所有权），要么是显式克隆后再移动，要么是隐式拷贝后再移动。

```rust
fn main() {
    let x = Box::<u32>::new(5);
    let y = x; // 移动
    let z = y.clone(); // 显式克隆后移动
    let w = *y; // 隐式拷贝 Box 的内容后移动
}
```

在某些情况下，如果类似用户自定义的拷贝赋值可以避免分配，`Clone` trait 提供了一个额外的方法 `clone_from`。该方法会自动定义，但在实现 `Clone` trait 时可以重写以提供更高效的实现。

该方法不会用于普通赋值，但在赋值性能很重要且可以通过更高效的实现提升性能时，可以显式调用。由于 `clone_from` 拥有被赋值对象的所有权，因此可以复用内存以避免分配，从而提升效率。

```rust
fn go(x: &Vec<u32>) {
    let mut y = vec![0; x.len()];
    // ...
    y.clone_from(&x);
    // ...
}
```

## 性能考量与 `Copy`

是否实现 `Copy` 应基于类型的语义，而不是性能。如果对象的大小成为性能瓶颈，应考虑使用引用（`&T` 或 `&mut T`），或将值放在堆上（[`Box<T>`](https://doc.rust-lang.org/std/boxed/index.html) 或 [`Rc<T>`](https://doc.rust-lang.org/std/rc/index.html)）。这些方式分别对应于按引用传递，或在 C++ 中使用 `std::unique_ptr` 或 `std::shared_ptr`。

{{#quiz copy_and_move_constructors.toml}}
