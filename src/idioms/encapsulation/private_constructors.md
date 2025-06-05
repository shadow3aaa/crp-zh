# 私有构造函数

在 C++ 中，可以通过将构造函数声明为 private，或者使用 `class` 并利用默认的私有可见性，将类的构造函数设为私有。

在 Rust 中，结构体的构造函数（真正的构造函数，而不是[“构造方法”](../constructors.md)）的可见性取决于类型及其所有字段的可见性。要实现类似 C++ 示例中的可见性限制，需要在 Rust 的结构体中额外添加一个私有字段。由于 Rust 支持零大小类型，这个额外字段不会带来性能损耗。[单元类型](https://doc.rust-lang.org/std/primitive.unit.html) 就是零大小类型，可以用于此目的。

<div class="comparison">

```cpp
#include <string>

struct Person {
  std::string name;
  int age;

private:
  Person() = default;
};

int main() {
  // 编译失败，Person::Person() 是私有的
  // Person nobody;

  // 从 C++20 起编译失败
  // Person alice{"Alice", 42};
  return 0;
}
```

```rust
mod person {
    pub struct Person {
        pub name: String,
        pub age: i32,
        _private: (),
    }

    impl Person {
        pub fn new(
            name: String,
            age: i32,
        ) -> Person {
            Person {
                name,
                age,
                _private: (),
            }
        }
    }
}

use person::*;

fn main() {
    // 结构体 person::Person 的字段 `_private`
    // 是私有的
    // let alice = Person {
    //     name: "Alice".to_string(),
    //     age: 42,
    //     _private: (),
    // };

    // 由于存在私有字段，无法用结构体字面量语法构造 person::Person
    // let bob = Person {
    //     name: "Bob".to_string(),
    //     age: 55,
    // };

    let carol =
        Person::new("Carol".to_string(), 20);
    // 可以匹配公开字段，剩余字段用 .. 忽略
    let Person { name, age, .. } = carol;
}
```

</div>

## 枚举

与 C++ 的 union 不同，但类似于 `std::variant`，Rust 的枚举无法直接控制其变体或变体字段的可见性。在下例中，`Shape` union 的 `circle` 变体不是 public，因此只能在 `Shape` 的定义内部访问，比如通过 `make_circle` 静态方法。

```cpp
#include <iostream>

struct Triangle {
  double base;
  double height;
};

struct Circle {
  double radius;
};

union Shape {
  Triangle triangle;

private:
  Circle circle;

public:
  static Shape make_circle(double radius) {
    Shape s;
    s.circle = Circle(radius);
    return s;
  };
};

int main() {
  Shape triangle;
  triangle.triangle = Triangle{1.0, 2.0};
  Shape circle = Shape::make_circle(1.0);

  // 编译失败
  // circle.circle = Circle{1.0};

  // 编译失败
  // std::cout << shape.circle.radius;
}
```

在 Rust 中，无法对单个枚举变体或其字段应用可见性修饰符。

```rust
mod shape {
    pub enum Shape {
        Triangle { base: f64, height: f64 },
        Circle { radius: f64 },
    }
}

use shape::*;

fn main() {
    // 变体构造器可访问，即使未标记为 pub
    let triangle = Shape::Triangle {
        base: 1.0,
        height: 2.0,
    };

    let circle = Shape::Circle { radius: 1.0 };

    // 字段可访问，即使未标记为 pub
    match circle {
        Shape::Triangle { base, height } => {
            println!("Triangle: {}, {}", base, height);
        }
        Shape::Circle { radius } => {
            println!("Circle: {}", radius);
        }
    }
}
```

要控制枚举的构造和模式匹配，有两种常见做法。第一种做法可以控制字段的构造和访问，但不能限制变体的判别。

```rust
mod shape {
    pub struct Triangle {
        pub base: f64,
        pub height: f64,
        _private: (),
    }
    pub struct Circle {
        pub radius: f64,
        _private: (),
    }

    pub enum Shape {
        Triangle(Triangle),
        Circle(Circle),
    }

    impl Shape {
        pub fn new_triangle(base: f64, height: f64) -> Shape {
            Shape::Triangle(Triangle {
                base,
                height,
                _private: (),
            })
        }

        pub fn new_circle(radius: f64) -> Shape {
            Shape::Circle(Circle {
                radius,
                _private: (),
            })
        }
    }
}

use shape::*;

fn main() {
    let triangle = Shape::new_triangle(1.0, 2.0);
    let circle = Shape::new_circle(1.0);

    match circle {
        Shape::Triangle(Triangle { base, height, .. }) => {
            println!("Triangle: {}, {}", base, height);
        }
        Shape::Circle(Circle { radius, .. }) => {
            println!("Circle: {}", radius);
        }
    }
}
```

第二种做法是将枚举放入带有私有字段的结构体中，从而阻止模块外部的构造和判别。

```rust
mod shape {
    enum ShapeKind {
        Triangle { base: f64, height: f64 },
        Circle { radius: f64 },
    }

    pub struct Shape(ShapeKind);

    impl Shape {
        pub fn new_circle(radius: f64) -> Shape {
            Shape(ShapeKind::Circle { radius })
        }

        pub fn new_triangle(base: f64, height: f64) -> Shape {
            Shape(ShapeKind::Triangle { base, height })
        }

        pub fn print(&self) {
            match self.0 {
                ShapeKind::Triangle { base, height } => {
                    println!("Triangle: {}, {}", base, height);
                }
                ShapeKind::Circle { radius } => {
                    println!("Circle: {}", radius);
                }
            }
        }
    }
}

use shape::*;

fn main() {
    let triangle = Shape::new_triangle(1.0, 2.0);
    let circle = Shape::new_circle(1.0);

    // 编译失败，因为 Shape 有私有字段
    // match circle {
    //   Shape(_) -> {}
    // }

    circle.print();
}
```

如果让变体私有的目的是为了保证不变量成立，那么可以将实现枚举（如 `ShapeKind`）公开，但不公开包装结构体（如 `Shape`）的字段，仅当使用包装结构体时才能保证不变量。在这种情况下，需要将字段设为私有并定义 getter 方法，否则字段可被修改，可能破坏包装结构体所代表的不变量。

```rust
mod shape {
    pub enum ShapeKind {
        Triangle { base: f64, height: f64 },
        Circle { radius: f64 },
    }

    // Shape 的字段是私有的
    pub struct Shape(ShapeKind);

    impl Shape {
        pub fn new(kind: ShapeKind) -> Option<Shape> {
            // ... 检查不变量 ...
            Some(Shape(kind))
        }

        pub fn get_kind(&self) -> &ShapeKind {
            &self.0
        }
    }
}

use shape::*;

fn main() {
    let triangle = Shape::new(ShapeKind::Triangle {
        base: 1.0,
        height: 2.0,
    });
    let Some(circle) = Shape::new(ShapeKind::Circle { radius: 1.0 }) else {
        return;
    };

    // 编译失败，因为 Shape 有私有字段
    // match circle {
    //   Shape(c) => {}
    // };

    match circle.get_kind() {
        ShapeKind::Triangle { base, height } => {
            println!("Triangle: {}, {}", base, height);
        }
        ShapeKind::Circle { radius } => {
            println!("Circle: {}", radius);
        }
    }
}
```

Rust 的这种情况类似于 C++ 使用 `std::variant` 时的情形，此时无法让变体本身为私有。可以让组成变体的类型的构造函数为私有，或者用带有合适可见性控制的类包装 variant。

## Rust 的 `#[non_exhaustive]` 注解

如果结构体或枚举希望在[crate](https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html) 内部公开，但不希望在 crate 外部被构造，可以使用 `#[non_exhaustive]` 属性来限制构造。该属性可用于结构体和单个枚举变体，效果与添加私有字段类似。

但该属性的约束作用在 crate 级别，而不是模块级别。

```rust
#[non_exhaustive]
pub struct Person {
    pub name: String,
    pub age: i32,
}

pub enum Shape {
    #[non_exhaustive]
    Triangle { base: f64, height: f64 },
    #[non_exhaustive]
    Circle { radius: f64 },
}
```

该属性更常用于强制库的使用者在匹配结构体字段时包含通配符，这样在结构体新增字段时不会造成破坏性变更（即不需要[增加主版本号](https://doc.rust-lang.org/cargo/reference/semver.html)）。

将 `#[non_exhaustive]` 属性应用于枚举本身，相当于让某个变体为私有，要求在匹配变体时使用通配符。这在版本控制上与用于结构体时效果相同，但实际意义较小。大多数情况下，新增枚举变体导致代码无法编译是有益的，因为这表明需要处理新的分支逻辑。

{{#quiz private_constructors.toml}}
