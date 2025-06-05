# 默认构造函数

C++ 有一个特殊的默认构造函数概念，用于支持多种会隐式调用它的场景。  
Rust 没有完全相同的默认构造函数机制，最接近的是 [`Default` trait](https://doc.rust-lang.org/std/default/trait.Default.html)。

<div class="comparison">

```cpp
class Person {
    int age;

public:
    // 默认构造函数
    Person() : age(0) {}
}
```

```rust
struct Person {
   age: i32,
}

impl Person {
    pub const fn new() -> Self {
        Self { age: 0 }
    }
}

impl Default for Person {
    fn default() -> Self {
        Self::new()
    }
}
```

</div>

如果一个结构体有有意义的默认值（类似于 C++ 的默认构造函数），那么该类型应同时提供一个无参数的 `new` 方法和 `Default` trait 的实现。  
详见 [相关 API 指南](https://rust-lang.github.io/api-guidelines/interoperability.html?highlight=default#types-eagerly-implement-common-traits-c-common-traits)。

## 类成员的隐式初始化

在 C++ 中，如果成员没有被构造函数显式初始化，则会被默认初始化。当成员类型是类时，默认初始化会调用其默认构造函数。

在 Rust 中，如果结构体的所有字段都实现了 `Default` trait，则编译器可以为该结构体自动生成实现。

<div class="comparison">

```cpp
class Person {
  int age;

public:
  Person() : age(0) {}
}

class Student {
  Person person;
}
```

```rust
#[derive(Default)]
struct Person {
    age: i32,
}

#[derive(Default)]
struct Student {
    person: Person,
}
```

</div>

Rust 中的 `#[derive(Default)]` 宏等价于如下手动实现：

```rust
struct Person {
    age: i32,
}

impl Default for Person {
    fn default() -> Self {
        Self {
            age: Default::default()
        }
    }
}

struct Student {
    person: Person,
}

impl Default for Student {
    fn default() -> Self {
        Self {
            person: Default::default()
        }
    }
}
```

与 C++ 中整数默认初始化值不确定不同，Rust 的原始整数和浮点类型的默认值[为零](https://doc.rust-lang.org/std/primitive.i32.html#impl-Default-for-i32)。

<a name="struct-update"></a> 派生 `Default` trait 在代码简洁性上类似于 C++ 省略初始化的写法。当所有字段类型都实现了 `Default`，但只希望部分字段使用默认值时，可以用 [结构体更新语法](https://doc.rust-lang.org/book/ch05-01-defining-structs.html#creating-instances-from-other-instances-with-struct-update-syntax) 定义构造方法，无需枚举所有字段的值。

```rust
#[derive(Default)]
struct Person {
    age: i32,
}

#[derive(Default)]
struct Student {
    person: Person,
    favorite_color: Option<String>,
}

impl Student {
    pub fn with_favorite_color(color: String) -> Self {
        Student {
            favorite_color: Some(color),
            ..Default::default()
        }
    }
}
```

## 数组值的隐式初始化

在 C++ 中，未显式初始化的数组会用默认构造函数进行默认初始化。

在 Rust 中，必须显式指定数组的初始化值。

<div class="comparison">

```cpp
class Person {
  int age;

public:
  Person() : age(0) {}
};

int main() {
  Person people[3];
  // ...
}
```

```rust
#[derive(Default)]
struct Person {
    age: i32,
}

fn main() {
    // std::array::from_fn 提供索引给回调
    let people: [Person; 3] = 
        std::array::from_fn(|_| Default::default());
    // ...
}
```

</div>

如果类型是[可平凡复制的](./copy_and_move_constructors.md#trivially-copyable-types)，可以使用更简洁的写法：

```rust
#[derive(Clone, Copy, Default)]
struct Person {
    age: i32,
}

fn main() {
    let people: [Person; 3] = [Default::default(); 3];
    // ...
}
```

## 容器元素初始化

在 C++ 中，默认构造函数可用于隐式定义集合类型，如 `std::vector`。C++11 之前，先构造一个值，再用它拷贝构造所有元素；C++11 及以后，所有元素都用默认构造函数初始化。

在 Rust 中，和数组初始化一样，必须显式指定元素值。可以先构造数组，再转换为向量，实现与数组相同的语法。

<div class="comparison">

```cpp
#include <vector>

class Person {
    int age;

public:
    Person() : age(0) {}
}

int main() {
    std::vector<Person> people(3);
    // ...
}
```

```rust
#[derive(Default)]
struct Person {
    age: i32,
}

fn main() {
    let people_arr: [Person; 3] = 
        std::array::from_fn(|_| Default::default());
    let people: Vec<Person> = Vec::from(people_arr);
    // ...
}
```

</div>

在 Rust 中，也可以通过迭代器构造向量：

```rust
#[derive(Default)]
struct Person {
    age: i32,
}

fn main() {
    let people: Vec<Person> = (0..3).map(|_| Default::default()).collect();
    // ...
}
```

如果类型实现了 `Clone` trait，则可以用 `vec!` 宏构造数组。详见[拷贝构造函数章节](./copy_and_move_constructors.md)。

```rust
#[derive(Clone, Default)]
struct Person {
    age: i32,
}

fn main() {
    let people: Vec<Person> = vec![Default::default(); 3];
    // ...
}
```

## 局部变量的隐式初始化

在 C++ 中，默认构造函数用于对未显式初始化的局部变量进行默认初始化。

在 Rust 中，局部变量的初始化总是显式的。

<div class="comparison">

```cpp
class Person {
    int age;

public:
    Person() : age(0) {}
};

int main() {
    Person person;
    // ...
}
```

```rust
#[derive(Clone, Default)]
struct Person {
    age: i32,
}

fn main() {
    let person = Person::default();
    // ...
}
```

</div>

## 基类对象的隐式初始化

在 C++ 中，如果未指定其他构造函数，默认构造函数会用于初始化基类对象。

```cpp
class Base {
  int x;

public:
  Base() : x(0) {}
};

class Derived : Base {
public:
  // 调用 Base 的默认构造函数
  Derived() {}
};
```

Rust 没有继承，因此没有对应场景。  
可参考[实现复用章节](../data_modeling/inheritance_and_reuse.md)或 [Rust 书中关于 trait 的部分](https://doc.rust-lang.org/book/ch10-02-traits.html) 了解替代方案。

## `std::unique_ptr`

在 Rust 中，`Default` trait 还有一些 C++ 默认构造函数未涉及的用法。

Rust 的智能指针类型通过委托被包裹类型的 `Default` 实现自身的 `Default`。

```rust
#[derive(Default)]
struct Person {
    age: i32,
}

fn main() {
    let b: Box<Person> = Default::default();
    // ...
}
```

这与 C++ 的 `std::unique_ptr` 不同，后者是可空的，默认构造会得到一个空指针。而 Rust 的等价类型是 `Option<Box<Person>>`，其 `Default` 实现会生成 `None`。

## `Default` 的其他用法

[`Option::unwrap_or_default`](https://doc.rust-lang.org/std/option/enum.Option.html#method.unwrap_or_default) 利用 `Default`，方便地在 `Option` 为 `None` 时获取默认值。

```rust
fn go(x: Option<i32>) {
    let a: i32 = x.unwrap_or_default();
    // 如果 x 是 None，则 a 为 0

    // ...
}
```

C++ 的 `std::optional` 没有等价的方法。

{{#quiz default_constructors.toml}}
