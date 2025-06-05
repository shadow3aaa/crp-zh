# 奇异递归模板模式（CRTP）

C++ 的[奇异递归模板模式（CRTP）](https://en.cppreference.com/w/cpp/language/crtp)用于让派生类的具体类型在基类定义的方法中可用。

## 通过静态多态共享实现

CRTP 的基本用途是减少使用静态多态时的实现冗余。在这种用法中，`this` 指针被转换为模板参数提供的类型，从而可以调用派生类的方法。这使得基类中实现的方法能够调用派生类的方法，而无需将其声明为虚函数，从而避免了动态分派的开销。

在下面的示例中，`Triangle` 和 `Square` 共享了 `twiceArea` 的实现，无需动态分派。这个用例在 Rust 中通过 trait 的默认方法实现。

<div class="comparison">

```cpp
#include <iostream>

template <typename T>
struct Shape {
  // 该实现是共享的，并且可以调用
  // 派生类的 area 方法，无需声明为虚函数。
  double twiceArea() {
    return 2.0 * static_cast<T *>(this)->area();
  }
};

struct Triangle : public Shape<Triangle> {
  double base;
  double height;

  Triangle(double base, double height)
      : base(base), height(height) {}

  double area() {
    return 0.5 * base * height;
  }
};

struct Square : public Shape<Square> {
  double side;

  Square(double side) : side(side) {}

  double area() {
    return side * side;
  }
};

int main() {
  Triangle triangle{2.0, 1.0};
  Square square{2.0};

  std::cout << triangle.twiceArea() << std::endl;
  std::cout << square.twiceArea() << std::endl;
}
```

```rust
trait Shape {
    fn area(&self) -> f64;

    fn twice_area(&self) -> f64 {
        2.0 * self.area()
    }
}

struct Triangle {
    base: f64,
    height: f64,
}

impl Shape for Triangle {
    fn area(&self) -> f64 {
        0.5 * self.base * self.height
    }
}

struct Square {
    side: f64,
}

impl Shape for Square {
    fn area(&self) -> f64 {
        self.side * self.side
    }
}

fn main() {
    let triangle = Triangle {
        base: 2.0,
        height: 1.0,
    };
    let square = Square { side: 2.0 };
    println!("{}", triangle.twice_area());
    println!("{}", square.twice_area());
}
```

</div>

在 Rust 中，默认方法无需额外处理即可静态调用 `area`，原因在于对 `self` 的方法调用总是静态解析的。这是因为 [Rust 不支持具体类型之间的继承](../idioms/data_modeling/inheritance_and_reuse.md)。尽管默认方法定义在 trait 中，但实际实现是作为实现结构体的一部分。

## 方法链式调用

CRTP 的另一个常见用途是当链式调用的方法由基类实现时，实现方法链式调用。

在 C++ 中，模板参数用于确保共享函数返回的是派生类的类型，这样可以继续调用派生类中定义的其他方法。模板参数也用于在不声明虚函数的情况下调用派生类型的方法。

在 Rust 中，不需要模板参数，因为 trait 中的 `Self` 类型已经可以引用实现结构体的类型。

<div class="comparison">

```cpp
#include <iostream>
#include <span>
#include <string>
#include <vector>

// D 是派生类的类型
template <typename D>
struct Combinable {
  D combineWith(D &d);

  // concat 在基类中实现，但操作的是派生类的值。
  D concat(std::span<D> vec) {
    D acc(*static_cast<D *>(this));

    for (D &v : vec) {
      acc = acc.combineWith(v);
    }

    return acc;
  }
};

struct Sum : Combinable<Sum> {
  int sum;

  Sum(int sum) : sum(sum) {}

  Sum combineWith(Sum s) {
    return Sum(sum + s.sum);
  }

  // Sum 包含一个可以链式调用的额外方法。
  Sum mult(int n) {
    return Sum(sum * n);
  }
};

int main() {
  Sum s(0);
  std::vector<Sum> v{1, 2, 3, 4};
  Sum x = s.concat(v)
              // 尽管 concat 属于基类，但它返回的是
              // 实现类的值，因此可以链式调用该类特有的方法。
              .mult(2)
              .combineWith(5);
  std::cout << x.sum << std::endl;
}
```

```rust
// 不需要泛型类型：Self 已经指向实现类型。
trait Combinable {
    fn combine_with(&self, other: &Self) -> Self;

    // concat 有一个基于 Self 的默认实现。
    fn concat(&self, others: &[Self]) -> Self
    where
        Self: Clone,
    {
        let mut acc = self.clone();

        for v in others {
            acc = acc.combine_with(v);
        }
        acc
    }
}

#[derive(Clone)]
struct Sum(i32);

impl Sum {
    // Sum 包含一个可以链式调用的额外方法。
    fn mult(&self, n: i32) -> Self {
        Self(self.0 * n)
    }
}

impl Combinable for Sum {
    fn combine_with(&self, other: &Self) -> Self {
        Self(self.0 + other.0)
    }
}

fn main() {
    let s = Sum(0);
    let v = vec![Sum(1), Sum(2), Sum(3), Sum(4)];
    let x = s
        .concat(&v)
        // 尽管 concat 属于 trait，但它返回的是
        // 实现类型的值，因此可以链式调用该类型特有的方法。
        .mult(2)
        .combine_with(&Sum(5));
    println!("{}", x.0)
}
```

</div>

同样，`Self` 能够引用实现类型，是因为 [Rust 不支持具体类型之间的继承](../idioms/data_modeling/inheritance_and_reuse.md)。这与 C++ 形成对比，在 C++ 中一个值可能属于多个具体类型，因此无法明确 `Self` 应该指向哪个类型。

{{#quiz crtp.toml}}
