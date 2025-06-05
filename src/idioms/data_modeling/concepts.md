# 概念、接口与静态分发

在 C++ 中，通过实现模板函数或模板方法，并使用某些预期接口与类型交互，可以实现基于接口的静态分发。

下面的模板函数 `twiceArea` 利用了模板类型参数的 `area()` 方法。

在 Rust 中，实现同样目标需要定义一个 trait（如 `Shape`），并在泛型函数的类型参数上使用该 trait 作为约束。

<div class="comparison">

```cpp
#include <iostream>

struct Triangle {
  double base;
  double height;

  Triangle(double base, double height)
      : base(base), height(height) {}

  // 不是虚函数：将用于静态分发
  double area() {
    return 0.5 * base * height;
  }
};

// 使用接口的泛型函数
template <class T>
double twiceArea(T &shape) {
  return shape.area() * 2;
}

int main() {
  Triangle triangle{1.0, 1.0};

  std::cout << twiceArea(triangle) << std::endl;
  return 0;
}
```

```rust
// 泛型函数将使用的接口
trait Shape {
    fn area(&self) -> f64;
}

struct Triangle {
    base: f64,
    height: f64,
}

// 为类型实现接口
impl Shape for Triangle {
    fn area(&self) -> f64 {
        0.5 * self.base * self.height
    }
}

// 使用接口的泛型函数
fn twice_area<T: Shape>(shape: &T) -> f64 {
    2.0 * shape.area()
}

fn main() {
    let triangle = Triangle {
        base: 1.0,
        height: 1.0,
    };

    println!("{}", twice_area(&triangle));
}
```

</div>

注意，在 Rust 示例中，trait 和结构体的定义与[虚方法与动态分发](./abstract_classes.md)章节中的例子没有变化。即便如此，这个例子用的是静态分发。这是 Rust 在 vtable 和 vptr 表示上的设计权衡所致，[详见该章节后文](./abstract_classes.md#vtables-and-rust-trait-object-types)。

上述示例中 Rust 与 C++ 的区别在于，Rust 是名义类型（类型必须显式支持某接口，仅有相应方法还不够），而 C++ 的模板元编程实现了一种结构化或鸭子类型（类型只需拥有实际用到的方法，无需显式声明支持接口）。

## 模板 vs 泛型函数

Rust 采用名义类型而非结构类型的原因，源于 C++ 模板与 Rust 泛型函数的差异。具体来说，C++ 模板只有在所有模板参数都提供并完全展开后才进行类型检查，而 Rust 泛型函数会在不知道类型参数时就进行类型检查。

由于函数在类型参数未知时就被检查，因此可用于这些类型值的方法和函数也必须在类型参数未知时就已知。

这种设计在语言层面上更易于推理，牺牲了模板编程的灵活性，换来了简洁性。尤其是在编写依赖其他泛型函数的库时，C++ 编译器很难给出静态保证，因为无法测试所有可能的实例化。

不过，在 C++ 和 Rust 中，编译器都会生成多个实现以实现静态分发。

## C++ 约束与概念

Rust 对接口的静态分发方式，可以通过严格应用 [C++ 概念](https://en.cppreference.com/w/cpp/language/constraints)进行部分（但仅部分）建模。

概念的常规用法仍然是结构化的，并不能完全模拟 Rust 的方式：它只要求类型上存在具有特定属性的方法。

```cpp
#include <concepts>

template <typename T>
concept shape = requires(T t) {
  { t.area() } -> std::same_as<double>;
};

template <shape T>
double twiceArea(T shape) {
  return shape.area() * 2;
}
```

C++ 中更接近上述 Rust 程序的做法，是结合抽象类和概念。

```cpp
#include <concepts>

struct Shape {
  Shape() {}
  virtual ~Shape() {}
  virtual double area() = 0;
};

template <typename T>
concept shape = std::derived_from<T, Shape>;

struct Triangle : Shape {
  double base;
  double height;

  Triangle(double base, double height) : base(base), height(height) {}

  // 依然不是虚函数：用于静态分发
  double area() override {
    return 0.5 * base * height;
  }
};

template <shape T>
double twiceArea(T shape) {
  return shape.area() * 2;
}

int main() {
  Triangle triangle{1.0, 1.0};

  std::cout << twiceArea(triangle) << std::endl;
  return 0;
}
```

但这仍然不同，因为概念只对模板的使用做了约束，而不是对模板内部类型 `T` 的值做约束。而在 Rust 中，trait 约束两者。因此，下面的代码在 C++ 中依然可以编译：

```cpp
#include <concepts>

struct Shape {
  Shape() {}
  virtual ~Shape() {}
  virtual double area() = 0;
};

template <typename T>
concept shape = std::derived_from<T, Shape>;

template <shape T>
double twiceArea(T shape) {
  // 注意这里调用了 Shape 未定义的方法
  return shape.volume() * 2;
}
```

但在 Rust 中，等价代码无法编译，会报错：

```rust,ignore
trait Shape {
    fn area(&self) -> f64;
}

fn twice_area<T: Shape>(shape: &T) -> f64 {
    // 注意这里调用了 Shape 未定义的方法
    2.0 * shape.volume()
}
```

```text
error[E0599]: no method named `volume` found for reference `&T` in the current scope
 --> example.rs:7:17
  |
7 |     2.0 * shape.volume()
  |                 ^^^^^^ method not found in `&T`
```

这些额外的静态检查意味着，在许多 C++ 模板可用但难以正确实现的场景下，Rust 泛型可以被广泛、安全地使用。

## 必需 trait 与语法简化

在上面的例子中，需要 trait 的函数定义如下：

```rust,ignore
fn twice_area<T: Shape>(shape: &T) -> f64 {
    2.0 * shape.area()
}
```

这是下面写法的常用简写：

```rust,ignore
fn twice_area<T>(shape: &T) -> f64
where
    T: Shape,
{
    2.0 * shape.area()
}
```

当有多个类型参数或类型参数需要实现多个 trait 时，更冗长的写法更清晰。而在某些情况下，还可以用 `impl` 关键字进一步简化：

```rust,ignore
fn twice_area(shape: &impl Shape) -> f64 {
    2.0 * shape.area()
}
```

## 泛型与生命周期

在 C++ 中定义使用类型模板参数的模板时，类型中存储的引用的生命周期需要程序员手动管理。

下面这个（人为构造的）C++ 示例可以正常编译，但可能导致未定义行为：

```cpp
$#include <memory>
$
$struct Shape {
$  Shape() {}
$  virtual ~Shape() {}
$  virtual double area() = 0;
$};
$
template<typename S>
void store(S s, std::unique_ptr<Shape> data) {
    // `s` 中的指针或引用在 `data` 仍被使用时会不会悬空？
	*data = s;
}
```

Rust 会检查类型参数中引用的生命周期边界。[与 trait 对象类型一样](./abstract_classes.md#trait-objects-and-lifetimes)，这些边界通常由[生命周期省略规则](https://doc.rust-lang.org/reference/lifetime-elision.html)自动推断。当无法推断或推断错误时，可以手动声明生命周期边界。

在上面例子的 Rust 版本中，由于推断出的生命周期边界不正确，必须手动指定。否则编译器会报错：

```rust,ignore
# trait Shape {}
#
fn store<S: Shape>(x: S, data: &mut Box<dyn Shape>) {
    *data = Box::new(x);
}
```

```text
error[E0310]: the parameter type `S` may not live long enough
 --> example.rs:7:5
  |
7 |     *data = Box::new(x);
  |     ^^^^^
  |     |
  |     the parameter type `S` must be valid for the static lifetime...
  |     ...so that the type `S` will meet its required lifetime bounds
 |
```

当将推断出的生命周期边界显式写出后，错误信息会更清晰。对于 `store` 的类型，`x` 参数可能拥有的生命周期比 box 中内容的生命周期短。

```rust,ignore
# trait Shape {}
#
# struct Triangle {
#     base: f64,
#     height: f64,
# }
#
# impl Shape for Triangle {}
#
# S 类型参数没有生命周期约束
fn store<'a, S: Shape>(
    x: S,
    // 该引用由[生命周期省略规则]分配新生命周期
    //
    // trait 对象由[trait-object.default]和[trait-object.innermost-type]规则分配 'static
    data: &'a mut Box<dyn Shape + 'static>,
) {
    *data = Box::new(x);
}

// 下面演示如何用该类型的 store 实现导致悬空引用
fn main() {
    let triangle = Triangle {
        base: 1.0,
        height: 2.0,
    };
    let mut b: Box<dyn Shape> = Box::new(triangle);
    {
        let short_lived_triangle = Triangle {
            base: 5.0,
            height: 10.0,
        };
        store(short_lived_triangle, &mut b);
    }
    // 此处 b 内部已悬空
}
```

对于这种情况，最通用的解决方案是定义一个新的生命周期参数，同时约束 `S` 和 `dyn Shape`。引用的生命周期参数可以省略，因为会自动分配一个新的生命周期参数。

```rust
trait Shape {}

// 注意这里的公共生命周期约束
// -----------------here-\
 // ----------------------|---------------------------and here-\
 //                       v                                    v
fn store<'s, S: Shape + 's>(x: S, data: &mut Box<dyn Shape + 's>) {
    *data = Box::new(x);
}
```

{{#quiz concepts.toml}}
