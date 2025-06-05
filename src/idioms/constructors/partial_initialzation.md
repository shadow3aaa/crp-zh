# 构造与初始化分离

在 Rust 中，是否需要将构造和初始化分离，取决于你的具体需求。

- 如果需要渐进式初始化，请使用[构建者模式](#rust-构建者模式)。
- 构造过程中使用虚方法在 Rust 中[不适用](#初始化过程中使用虚方法)。
- 如果需要预分配存储或复用已分配的对象，请参考[预分配缓冲区](../out_params/pre-allocated_buffers.md)章节中的技术和限制。

## Rust 构建者模式

在 Rust 中实现构建者模式，通常需要定义一个额外的“构建者”类型，用于表示部分构造的值。此时，每个字段的类型 `T` 在构建者中都变为 `Option<T>`。这与 C++ 不同，C++ 可以通过空值或未初始化内存来渐进式构造对象。

<div class="comparison">

```cpp
#include <memory>
#include <string>

struct Pet {
  std::string name;
};

struct Person {
  int age;
  std::shared_ptr<Pet> pet;
};

int main() {
  Person person;
  // 可以不通过构建者进行渐进式初始化。
  //
  // 此时 age 未定义，pet 为 nullptr。
  person.age = 42;
  person.pet = std::make_shared<Pet>("Mittens");
}
```

```rust
use std::rc::Rc;

struct Pet {
    name: String,
}

struct Person {
    age: i32,
    pet: Rc<Pet>,
}

struct PersonBuilder {
    age: Option<i32>,
    pet: Option<Rc<Pet>>,
}

impl PersonBuilder {
    fn new() -> PersonBuilder {
        PersonBuilder {
            age: None,
            pet: None,
        }
    }

    fn age(&mut self, age: i32) -> &mut Self {
        self.age = Some(age);
        self
    }

    fn pet(&mut self, pet: Rc<Pet>) -> &mut Self {
        self.pet = Some(pet);
        self
    }

    fn build(&self) -> Option<Person> {
        Some(Person {
            age: self.age?,
            pet: self.pet.clone()?,
        })
    }
}

fn main() {
    let mut builder = PersonBuilder::new();
    let pet = Rc::new(Pet {
        name: "Mittens".to_string(),
    });
    let person = builder.age(42).pet(pet).build();
}
```

</div>

这种模式在 Rust 中非常常见，因此有相关库支持，例如 [`derive_builder` crate](https://crates.io/crates/derive_builder)。使用该 crate，上述示例可以大大简化：

```rust,ignore
#[derive(Builder)]
struct Person {
    age: i32,
    name: String,
}
```

生成的 API 还包含更多特性，例如 `build` 方法在未设置所有必需字段时会返回带有详细错误信息的 `Result::Err`，而不仅仅是 `None`。

### 替代方案：基于默认值更新

如果某个类型有合理的默认值，可以实现 `Default` trait。这样可以[基于 `Default` 实现提供的默认值来构造对象](./default_constructors.md#struct-update)，而无需构建者模式。

### 为什么构建者模式在 Rust 中比 C++ 更常见

构建者模式在 Rust 中比 C++ 更常见，原因包括：

1. Rust 对指针的所有权和可选性进行了正交建模；
2. Rust 要求显式处理枚举（tagged union）的所有变体。

这促使开发者用类型系统更明确地表达不变量。如果对象在构造前后有不同的不变量，就需要定义不同的结构体来表示这些状态。

具体来说，在渐进式构造过程中，字段是可选的；而一旦完全构造，字段就不再是可选的。

## 初始化过程中使用虚方法

在 C++ 中，分离初始化有时是为了解决构造过程中调用虚方法会导致未定义行为的问题。而 Rust 的构造机制不同，不需要类似的变通方法。C++ 中通常在构造函数中运行的代码，在 Rust 中通常定义为静态方法。C++ 构造函数执行期间存在的“部分构造”状态，在 Rust 中并不存在。
