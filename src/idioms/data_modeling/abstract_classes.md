# 抽象类、接口与动态分发

在 C++ 中，当接口需要通过动态分发来解析被调用的方法时，接口通常使用抽象类来定义。实现该接口的类型通过继承抽象类来实现。在 Rust 中，接口由 *trait*（特征）定义，然后为支持该特征的类型实现该 trait。程序可以基于 *trait object*（特征对象）来编写，以该 trait 作为其基类型。

下面的示例定义了一个接口、该接口的两个实现，以及一个接受满足该接口参数的函数。在 C++ 中，接口通过带有纯虚函数的抽象类定义；在 Rust 中，接口通过 trait 定义。在这两种语言中，函数（C++ 中为 `printArea`，Rust 中为 `print_area`）都通过动态分发调用方法。

<div class="comparison">

```cpp
#include <iostream>
#include <memory>

// 定义一个抽象类作为接口
struct Shape {
  Shape() = default;
  virtual ~Shape() = default;
  virtual double area() = 0;
};

// 为具体类实现接口
struct Triangle : public Shape {
  double base;
  double height;

  Triangle(double base, double height)
      : base(base), height(height) {}

  double area() override {
    return 0.5 * base * height;
  }
};

// 为具体类实现接口
struct Rectangle : public Shape {
  double width;
  double height;

  Rectangle(double width, double height)
      : width(width), height(height) {}

  double area() override {
    return width * height;
  }
};

// 通过接口引用使用对象
void printArea(Shape &shape) {
  std::cout << shape.area() << std::endl;
}

int main() {
  Triangle triangle = Triangle{1.0, 1.0};

  printArea(triangle);

  // 通过拥有指针使用接口对象
  std::unique_ptr<Shape> shape;
  if (true) {
    shape = std::make_unique<Rectangle>(1.0, 1.0);
  } else {
    shape = std::make_unique<Triangle>(
        std::move(triangle));
  }

  // 转换为接口引用
  printArea(*shape);
}
```

```rust
// 定义一个接口
trait Shape {
    fn area(&self) -> f64;
}

struct Triangle {
    base: f64,
    height: f64,
}

// 为具体类型实现接口
impl Shape for Triangle {
    fn area(&self) -> f64 {
        0.5 * self.base * self.height
    }
}

struct Rectangle {
    width: f64,
    height: f64,
}

// 为具体类型实现接口
impl Shape for Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
}

// 通过接口引用使用值
fn print_area(shape: &dyn Shape) {
    println!("{}", shape.area());
}

fn main() {
    let triangle = Triangle {
        base: 1.0,
        height: 1.0,
    };

    print_area(&triangle);

    // 通过拥有指针使用接口值
    let shape: Box<dyn Shape> = if true {
        Box::new(Rectangle {
            width: 1.0,
            height: 1.0,
        })
    } else {
        Box::new(triangle)
    };

    // 转换为接口引用
    print_area(shape.as_ref());
}
```

</div>

Rust 的实现与 C++ 有一些细微差别。

在 Rust 中，只要 trait 可见，其方法也总是可见的。此外，只要 trait 和类型都可见，类型实现 trait 的事实也是可见的。这些 Rust 的特性解释了在某些 C++ 需要声明可见性的地方，Rust 不需要类似声明。

在 C++ 中，如果要将方法与类型本身（而不是类型的值）关联，需要使用 `static` 关键字。而在 Rust 中，非静态方法需要显式的 `self` 参数。这种语法选择使得可以像其他参数一样，明确指示方法是否会修改对象（通过 `&mut self` 而不是 `&self`），以及是否获取对象所有权（通过 `self` 而不是 `&self`）。

Rust 的方法不需要声明为 virtual。由于 vtable 表示的差异，所有类型的方法都可以用于动态分发。使用 vtable 的值类型通过 `dyn` 关键字标识。详见[下文](#vtables-and-rust-trait-object-types)。

此外，Rust 没有虚析构函数声明的等价物，因为在 Rust 中，每个 vtable 都包含了销毁行为（无论是用户自定义的 `Drop` 实现还是默认行为）。

## Vtable 与 Rust 特征对象类型

C++ 和 Rust 都需要某种间接方式来对接口进行动态分发。在 C++ 中，这种间接性表现为指向抽象类的指针（而不是派生的具体类），并利用 vtable 来解析虚函数。

在上面的 Rust 示例中，`dyn Shape` 类型就是 `Shape` trait 的特征对象类型。特征对象包含了 vtable 以及底层值。

在 C++ 中，所有继承自带有虚函数类的对象，其表示中都包含 vtable，无论是否实际使用动态分发。指向对象的指针或引用与没有虚函数的对象指针大小相同，但每个对象都包含自己的 vtable。

在 Rust 中，只有当值被表示为特征对象时才包含 vtable。特征对象的引用比普通引用大一倍，因为它包含了指向值的指针和指向 vtable 的指针。在上面的 Rust 示例中，`main` 函数中的局部变量 `triangle` 并不包含 vtable，但当其引用被转换为特征对象引用（以便传递给 `print_area`）时，就包含了 vtable 指针。

此外，正如 C++ 中抽象类不能作为局部变量、函数参数或返回值类型一样，Rust 中的特征对象类型在对应场景下也不能使用。在 Rust 中，这是通过 `dyn Shape` 不实现 `Sized` 标记 trait 来强制的，从而禁止其用于需要静态已知大小的场景。

下面的示例展示了由于未实现 `Sized`，特征对象类型在某些场景下可以或不可以使用。Rust 中禁止的用法在 C++ 中同样会被禁止，因为 `Shape` 是抽象类。

```rust
# trait Shape {
#     fn area(&self) -> f64;
# }
#
# struct Triangle {
#     base: f64,
#     height: f64,
# }
#
# impl Shape for Triangle {
#     fn area(&self) -> f64 {
#         0.5 * self.base * self.height
#     }
# }
#
fn main() {
    // 局部变量必须有已知大小。
    // let v: dyn Shape = Triangle { base: 1.0, height: 1.0 };

    // 引用总是有已知大小。
    let shape: &dyn Shape = &Triangle {
        base: 1.0,
        height: 1.0,
    };
    // Box 也总是有已知大小。
    let boxed_shape: Box<dyn Shape> = Box::new(Triangle {
        base: 1.0,
        height: 1.0,
    });

    // 类似 Option<T> 这样的类型直接存储 T 的值，因此也需要知道 T 的大小。
    // let v: Option<dyn Shape> = Some(Triangle { base: 1.0, height: 1.0 });
}

// 参数类型必须有已知大小。
// fn print_area(shape: dyn Shape) { }
fn print_area(shape: &dyn Shape) {}
```

将 vtable 包含在引用中而不是值中，是 Rust 能够同时用 trait 支持动态分发多态和[静态分发多态（C++ 中通常用 concepts 实现）](./concepts.md)的原因之一。

## Rust 中特征对象的限制

在 Rust 中，并非所有 trait 都能作为特征对象的基 trait。最常见的限制是，要求通过 `Sized` 超 trait 获得对象大小信息的 trait 不能用于 `dyn`。还有[其他限制](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility)。

## 特征对象与生命周期

使用动态分发的对象可能包含指向其他对象的指针或引用。在 C++ 中，这些引用的生命周期需要程序员手动管理。

Rust 会检查特征对象可能包含的引用的生命周期界限。如果没有显式给出，则会根据[生命周期省略规则](https://doc.rust-lang.org/reference/lifetime-elision.html#r-lifetime-elision.trait-object)推断。生命周期界限是特征对象类型的一部分。

通常，省略规则会推断出正确的生命周期界限。有时，这些规则会导致编译器给出令人困惑的错误信息。在这种情况下，或者编译器无法确定应分配哪个生命周期界限时，可以手动指定。下面的示例明确展示了结构体存储特征对象和 `print_area` 函数推断出的生命周期。

```rust
# trait Shape {
#     fn area(&self) -> f64;
# }
#
# struct Triangle {
#     base: f64,
#     height: f64,
# }
#
# impl Shape for Triangle {
#     fn area(&self) -> f64 {
#         0.5 * self.base * self.height
#     }
# }
#
struct Scaled {
    scale: f64,
    // 'static 是生命周期省略规则 [lifetime-elision.trait-object.default] 推断出的生命周期。
    shape: Box<dyn Shape + 'static>,
}

impl Shape for Scaled {
    fn area(&self) -> f64 {
        self.scale * self.shape.area()
    }
}

// 这些是生命周期省略规则 [lifetime-elision.function.implicit-lifetime-parameters]（针对引用）和 [lifetime-elision.trait-object.containing-type-unique]（针对 trait 约束）推断出的生命周期。
fn print_area<'a>(shape: &'a (dyn Shape + 'a)) {
    println!("{}", shape.area());
}

fn main() {
    let triangle = Triangle {
        base: 1.0,
        height: 1.0,
    };
    print_area(&triangle);

    let scaled_triangle = Scaled {
        scale: 2.0,
        shape: Box::new(triangle),
    };
    print_area(&scaled_triangle);
}
```

{{#quiz abstract_classes.toml}}
