# Setter 和 Getter 方法

Setter 和 Getter 在 C++ 和 Rust 中的工作方式类似，但在 Rust 中使用频率较低。

在 C++ 中，看到如下对二维向量的表示方式并不罕见，这种方式隐藏了实现细节，并通过 setter 和 getter 方法访问字段。这样做通常是为了在以后需要更改表示方式（比如从直角坐标改为极坐标）时，不会破坏客户端代码。

而在 Rust 中，这类类型几乎总是定义为公有字段。

<div class="comparison">

```cpp
class Vec2 {
  double x;
  double y;

public:
  Vec2(double x, double y) : x(x), y(y) {}
  double getX() { return x; }
  double getY() { return y; }

  // ... 向量操作 ...
};
```

```rust
pub struct Vec2 {
    // 使用公有字段而不是 getter
    pub x: f64,
    pub y: f64,
}

impl Vec2 {
    // ... 向量操作 ...
}
```

</div>

造成这种差异的一个主要原因是借用检查器的限制。使用 getter 函数时，整个结构体会被借用，导致无法对结构体的其他字段进行可变操作。

如下程序无法编译，因为 `get_name()` 借用了整个 `alice`：

```rust,ignore
struct Person {
    name: String,
    age: u32,
}

impl Person {
    fn get_name(&self) -> &String {
        &self.name
    }
}

fn main() {
    let mut alice = Person { name: "Alice".to_string(), age: 42 };
    let name = alice.get_name();

    alice.age = 43;

    println!("{}", name);
}
```

```text
error[E0506]: cannot assign to `alice.age` because it is borrowed
  --> example.rs:16:5
   |
14 |     let name = alice.get_name();
   |                ----- `alice.age` is borrowed here
15 |
16 |     alice.age = 43;
   |     ^^^^^^^^^^^^^^ `alice.age` is assigned to here but it was already borrowed
17 |
18 |     println!("{}", name);
   |                    ---- borrow later used here

error: aborting due to 1 previous error
```

造成这种做法差异的其他原因还包括：

- 易用性：公有成员可以方便地用于模式匹配。
- 性能透明性：表示方式的改变会极大影响 getter 的开销。暴露表示方式可以让开销变化变得可见。
- 可变性的控制：可变引用的静态生命周期检查消除了通过 Rust 等价于“观察指针”导致的意外修改的担忧。

## 具有不变量和新类型的类型

当类型需要保持某些不变量，但又希望享受暴露字段的好处时，可以使用 newtype 模式。定义一个包装的“新类型”结构体来表示带有不变量的数据，并通过不可变引用提供对底层结构体字段的访问。

```rust
pub struct Vec2 {
    pub x: f64,
    pub y: f64,
}

/// 表示模长为 1 的二维向量。
pub struct Normalized(Vec2); // 注意私有字段

fn sqrt_approx_zero(x: f64) -> bool {
    x < 0.001
}

impl Normalized {
    pub fn from_vec2(v: Vec2) -> Option<Self> {
        if sqrt_approx_zero(v.x * v.x + v.y * v.x - 1.0) {
            Some(Self(v))
        } else {
            None
        }
    }

    // Getter 提供对底层 Vec2 的引用，但不允许修改。
    pub fn get(&self) -> &Vec2 {
        &self.0
    }
}
```

## 从索引结构中借用

由于 getter 方法与借用检查器的交互方式，导致无法通过类似 `Vec::get_mut` 这样的方法对索引结构中的多个元素进行可变借用。

内置的索引类型提供了多种方法来创建结构体的分割视图。这些方法可以用来创建符合特定应用需求的辅助函数。

Rustonomicon 提供了[实现该模式的示例](https://doc.rust-lang.org/nomicon/borrow-splitting.html)，包括安全和不安全的 Rust 实现。

## Setter 方法

Setter 方法同样会借用整个值，这会导致与返回可变引用的 getter 方法相同的问题。与 getter 方法一样，setter 方法主要用于需要保持不变量的场景。

{{#quiz setters_and_getters.toml}}
