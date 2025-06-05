# 头文件

C++ 中头文件的一个用途是将一个翻译单元中定义的声明暴露给其他翻译单元，而无需在多个文件中重复声明。按照惯例，没有包含在头文件中的声明被认为是该翻译单元私有的（不过，要强制执行这一惯例，还需要其他机制，比如[匿名命名空间](./anonymous_namespaces.md)）。

相比之下，Rust 既不使用文本包含的头文件，也不需要前向声明。Rust 模块同时控制可见性和链接性，并通过公开定义将内容暴露给其他模块使用。

<div class="comparison">

```cpp
// person.h
class Person {
  std::string name;

public:
  Person(std::string name) : name(name) {}
  const std::string &getName();
};

// person.cc
#include <string>
#include "person.h"

const std::string &Person::getName() {
  return this->name;
}

// client.cc
#include <string>
#include "person.h"

int main() {
  Person p("Alice");
  const std::string &name = p.getName();

  // ...
}
```

```rust,ignore
// person.rs
pub struct Person {
    name: String,
}

impl Person {
    pub fn new(name: String) -> Person {
        Person { name }
    }

    pub fn name(&self) -> &String {
        &self.name
    }
}

// client.rs
mod person;

use person::*;

fn main() {
    let p = Person::new("Alice".to_string());
    // 无法编译，字段是私有的
    // let name = p.name;
    let name = p.name();

    //...
}
```

</div>

在 `person.rs` 中，`Person` 类型是公开的，但 `name` 字段不是。这既防止了该类型值的直接构造（类似于 C++ 中私有成员阻止聚合初始化），也阻止了字段访问。静态方法 `Person::new(String)` 和方法 `Person::name()` 通过 `pub` 可见性声明对模块的使用者开放。

在 `client` 模块中，`mod` 声明将 `person.rs` 的内容定义为名为 `person` 的子模块。`use` 声明将 `person` 模块的内容引入作用域。

## 本质区别

C++ 程序是由多个翻译单元组成的。头文件的存在使得来自其他翻译单元的定义可以通过前向声明进行管理。

Rust 程序是由模块树组成的。一个模块中的定义能否访问其他模块的内容，取决于这些模块自身定义的可见性声明。

## 子模块与更多可见性特性

模块和可见性声明比上述示例更为强大。关于如何使用模块、`pub` 和 `use` 实现封装目标的更多细节，请参见[私有成员与友元](./private_and_friends.md)一章。

{{#quiz headers.toml}}
