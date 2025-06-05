# 重载（Overloading）

C++ 支持函数重载，只要函数的调用可以通过参数的数量或类型来区分。

Rust 不支持这种函数重载。相反，Rust 提供了几种不同的机制（其中有些 C++ 也有）来实现类似重载的效果，并且这些机制与类型推断结合得更好。这些机制通常要求将重载函数之间的共性在代码中显式表达出来。

<div class="comparison">

```cpp
#include <string>

double twice(double x) {
  return x + x;
}

int twice(int x) {
  return x + x;
}
```

```rust
fn twice(x: f64) -> f64 {
    x + x
}

// error[E0428]: the name `twice` is defined multiple times
// fn twice(x: i32) -> i32 {
//     x + x
// }
```

</div>

实际上，即使在 C++ 中，上述示例通常也会用模板来实现得更结构化。

用这种方式表述后，该示例可以被翻译为 Rust，显著的不同是 [需要对类型加上 trait 约束](./data_modeling/concepts.md)。

<div class="comparison">

```cpp
template <typename T>
T twice(T x) {
  return x + x;
}
```

```rust
fn twice<T>(x: T) -> T::Output
where
    T: std::ops::Add<T>,
    T: Copy,
{
    x + x
}
```

</div>

## 重载方法

在 C++ 中，可以在同一类型上定义名称相同但签名不同的方法。而在 Rust 中，每个 trait 实现最多只能有一个同名方法，每个类型的固有方法（inherent method）同样如此。

如果有多个同名方法是因为该方法为多个 trait 定义的，那么在调用时必须通过指定 trait 来区分所需的方法。

```rust
trait TraitA {
    fn go(&self) -> String;
}

trait TraitB {
    fn go(&self) -> String;
}

struct MyStruct;

impl MyStruct {
    fn go(&self) -> String {
        "调用固有方法".to_string()
    }
}

impl TraitA for MyStruct {
    fn go(&self) -> String {
        "调用 Trait A 方法".to_string()
    }
}

impl TraitB for MyStruct {
    fn go(&self) -> String {
        "调用 Trait B 方法".to_string()
    }
}

fn main() {
    let my_struct = MyStruct;

    // 调用固有方法
    println!("{}", my_struct.go());

    // 调用 TraitA 的方法
    println!("{}", TraitA::go(&my_struct));

    // 调用 TraitB 的方法
    println!("{}", TraitB::go(&my_struct));
}
```

有一个例外是：当这些方法都来自同一个泛型 trait，但实现时类型参数不同。如果签名足以确定使用哪个实现，则无需指定 trait。这在使用 [`From` trait](https://doc.rust-lang.org/std/convert/trait.From.html) 时很常见。

```rust
struct Widget;

impl From<i32> for Widget {
    fn from(x: i32) -> Widget {
        Widget
    }
}

impl From<f32> for Widget {
    fn from(x: f32) -> Widget {
        Widget
    }
}

fn main() {
    // 调用 <Widget as From<i32>>::from
    let w1 = Widget::from(5);
    // 调用 <Widget as From<f32>>::from
    let w2 = Widget::from(1.0);
}
```

## 重载运算符

在 C++ 中，大多数运算符可以通过自由函数或在类中定义方法来重载。

Rust 通过实现特定的 trait 来提供运算符重载。仅仅实现与 trait 要求同名的方法，并不能让类型支持该运算符，必须实现对应的 trait。

<div class="comparison">

```cpp
struct Vec2 {
  double x;
  double y;

  Vec2 operator+(const Vec2 &other) const {
    return Vec2{x + other.x, y + other.y};
  }
};

int main() {
  Vec2 a{1.0, 2.0};
  Vec2 b{3.0, 4.0};
  Vec2 c = a + b;
}
```

```rust
#[derive(Clone, Copy)]
struct Vec2 {
    x: f64,
    y: f64,
}

impl std::ops::Add for &Vec2 {
    type Output = Vec2;

    // 注意这里 self 的类型是 &Vec2。
    fn add(self, other: Self) -> Vec2 {
        Vec2 {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

fn main() {
    let a = Vec2 { x: 1.0, y: 2.0 };
    let b = Vec2 { x: 3.0, y: 4.0 };
    let c = &a + &b;
}
```

</div>

此外，尤其是对于实现了 [`Copy trait`](./constructors/copy_and_move_constructors.md) 的类型，通常最好为各种引用类型的组合都实现 trait，因为它们很可能既会以引用也会以所有权方式使用。对于上述例子，需要定义四种实现。

```rust
#[derive(Clone, Copy)]
struct Vec2 {
    x: f64,
    y: f64,
}

impl std::ops::Add<&Vec2> for &Vec2 {
    type Output = Vec2;

    fn add(self, other: &Vec2) -> Vec2 {
        Vec2 {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

// 如果 Vec2 不是这么小的类型，下面这些实现由于会转移所有权，可能希望复用空间。

impl std::ops::Add<Vec2> for &Vec2 {
    type Output = Vec2;

    fn add(self, other: Vec2) -> Vec2 {
        Vec2 {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

impl std::ops::Add<&Vec2> for Vec2 {
    type Output = Vec2;

    fn add(self, other: &Vec2) -> Vec2 {
        Vec2 {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

impl std::ops::Add<Vec2> for Vec2 {
    type Output = Vec2;

    fn add(self, other: Vec2) -> Vec2 {
        Vec2 {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

fn main() {
    let a = Vec2 { x: 1.0, y: 2.0 };
    let b = Vec2 { x: 3.0, y: 4.0 };
    let c = a + b;
}
```

这种重复可以通过定义宏来解决。

```rust
#[derive(Clone, Copy)]
struct Vec2 {
    x: f64,
    y: f64,
}

macro_rules! impl_add_vec2 {
    ($lhs:ty, $rhs:ty) => {
        impl std::ops::Add<$rhs> for $lhs {
            type Output = Vec2;

            fn add(self, other: $rhs) -> Vec2 {
                Vec2 {
                    x: self.x + other.x,
                    y: self.y + other.y,
                }
            }
        }
    };
}

impl_add_vec2!(&Vec2, &Vec2);
impl_add_vec2!(&Vec2, Vec2);
impl_add_vec2!(Vec2, &Vec2);
impl_add_vec2!(Vec2, Vec2);

fn main() {
    let a = Vec2 { x: 1.0, y: 2.0 };
    let b = Vec2 { x: 3.0, y: 4.0 };
    let c = a + b;
}
```

## 默认参数

C++ 中的默认参数有时是通过函数重载实现的。

Rust 没有默认参数。可以通过 `Option` 类型的参数来实现类似的效果。

<div class="comparison">

```cpp
unsigned int shift(unsigned int x,
                   unsigned int shiftAmount) {
  return x << shiftAmount;
}

unsigned int shift(unsigned int x) {
  return shift(x, 2);
}

int main() {
  unsigned int a = shift(7); // shifts by 2
}
```

```rust
use std::ops::Shl;

fn shift(
    x: u32,
    shift_amount: Option<u32>,
) -> u32 {
    let a = shift_amount.unwrap_or(2);
    x.shl(a)
}

fn main() {
    let res = shift(7, None); // shifts by 2
}
```

</div>

## 无关的重载

Rust 不支持完全随意的重载，这促使开发者定义能捕捉类型间本质共性的 trait，使得函数可以基于这些接口实现并被广泛使用。但有时也会导致反模式，即定义只捕捉偶然共性的 trait（比如仅仅有同名方法）。

在这种情况下，更好的编程实践是直接定义不同的函数，而不是强行用 trait 来表达并不存在的共性。

在 Rust 中，这种情况常见于构造函数的静态方法命名约定。它们通常不会都叫 `new` 并通过不同参数区分，而是 [通常采用 `from_something`](https://rust-lang.github.io/api-guidelines/naming.html) 的形式，其中 `something` 根据构造来源不同而变化，或者用更具体的名称。

```rust
struct Vec3 {
    x: f64,
    y: f64,
    z: f64,
}

impl Vec3 {
    fn from_x(x: f64) -> Vec3 {
        Vec3 { x, y: 0.0, z: 0.0 }
    }

    fn from_y(y: f64) -> Vec3 {
        Vec3 { x: 0.0, y, z: 0.0 }
    }

    fn diagonal(d: f64) -> Vec3 {
        Vec3 { x: d, y: d, z: d }
    }
}
```

这与 `From` 和 `Into` trait 支持的转换方法不同，后者还可以用于泛型函数的 trait bound，以接收任何可转换为特定类型的类型。

{{#quiz overloading.toml}}
