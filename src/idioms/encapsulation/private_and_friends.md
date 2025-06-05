# 私有成员与友元

## 私有成员

在 C++ 中，封装的单位是类。访问限定符（`private`、`protected` 和 `public`）在类的边界上控制成员的访问。

在 Rust 中，模块是封装的单位。项的可见性（Rust 中类似于访问限定符）在模块边界上控制对项的访问。

<div class="comparison">

```cpp
#include <iostream>
#include <string>

class Person {
  int age;

public:
  std::string name;

  // 因为 age 是私有的，所以需要一个公有构造函数
  // 方法来创建实例。
  Person(std::string name, int age)
      : name(name), age(age) {}

  // 自由函数无法访问私有成员，
  // 所以必须是成员函数。
  static void example() {
    Person alice{"Alice", 42};
    std::ctout << alice.name << cout::endl;
    // 在类内部可以访问私有字段。
    std::ctout << alice.age << cout::endl;
  }
};

int main() {
  Person alice("Alice", 42);
  std::cout << alice.name << std::endl;
  // 编译错误
  // std::cout << alice.age << std::endl;
}
```

```rust
mod person {
    pub struct Person {
        pub name: String,
        // 该字段是私有的
        age: i32,
    }

    impl Person {
        // 因为 age 是私有的，所以需要一个公有
        // 构造方法来在 person 模块外部创建值。
        pub fn new(
            name: String,
            age: i32,
        ) -> Person {
            Person { name, age }
        }
    }

    // 同一模块中的自由函数可以访问私有字段，
    // 因为封装单位是模块而不是结构体。
    fn example() {
        let alice =
            Person::new("Alice".to_string(), 42);
        println!("{}", alice.name);
        // 在模块内部可以访问私有字段。
        println!("{}", alice.age);
    }
}

use person::Person;

fn main() {
    let alice =
        Person::new("Alice".to_string(), 42);
    println!("{}", alice.name);
    // 编译错误
    // println!("{}", alice.age);
}
```

</div>

在 Rust 示例中，[`Person` 的构造函数是私有的](./private_constructors.md)，因为其中一个字段是私有的。

## 友元

由于 Rust 的封装是在模块级别，类型的关联方法可以访问同一模块中定义的其他类型的内部内容。这涵盖了 C++ `friend` 声明的大多数用途。

例如，在 C++ 中定义二叉树时，表示树节点的类需要将主二叉树类声明为友元，以便访问其内部方法，同时对其他用途保持私有。即使将 `TreeNode` 类定义为 `BinaryTree` 的内部类，也需要这样做。

而在 Rust 中，可以将两种类型定义在同一个模块中，因此可以互相访问私有字段和方法。整个模块作为一个整体，提供了一组类型、方法和函数，共同定义了一个封装的概念。

<div class="comparison">

```cpp
#include <memory>

class BinaryTree {
  // 必须是内部类才能保持私有。
  class TreeNode {
    friend class BinaryTree;

    int value;
    std::unique_ptr<TreeNode> left;
    std::unique_ptr<TreeNode> right;

  public:
    TreeNode(int value)
        : value(value), left(nullptr),
          right(nullptr) {}

  private:
    static void
    insert(std::unique_ptr<TreeNode> &node,
           int value) {
      if (node) {
        node->insert(value);
      } else {
        node = std::make_unique<TreeNode>(value);
      }
    }

    void insert(int value) {
      if (value < this->value) {
        insert(this->left, value);
      } else {
        insert(this->right, value);
      }
    }
  };

  std::unique_ptr<TreeNode> root;

public:
  BinaryTree() : root(nullptr) {}

  void insert(int value) {
    TreeNode::insert(root, value);
  }
};

int main() {
  BinaryTree b;
  b.insert(42);

  return 0;
}
```

```rust
mod binary_tree {
    pub struct BinaryTree {
        // 该字段在模块外不可见。
        root: Option<Box<TreeNode>>,
    }

    impl BinaryTree {
        pub fn new() -> BinaryTree {
            BinaryTree { root: None }
        }

        pub fn insert(&mut self, value: i32) {
            insert(&mut self.root, value);
        }
    }

    // 该结构体及其所有字段在模块外不可见。
    struct TreeNode {
        value: i32,
        left: Option<Box<TreeNode>>,
        right: Option<Box<TreeNode>>,
    }

    impl TreeNode {
        fn new(value: i32) -> TreeNode {
            TreeNode {
                value,
                left: None,
                right: None,
            }
        }

        fn insert(&mut self, value: i32) {
            if value < self.value {
                insert(&mut self.left, value);
            } else {
                insert(&mut self.right, value);
            }
        }
    }

    // 该自由函数在模块外不可见。
    fn insert(
        node: &mut Option<Box<TreeNode>>,
        value: i32,
    ) {
        match node {
            None => {
                *node = Some(Box::new(
                    TreeNode::new(value),
                ));
            }
            Some(ref mut left) => {
                left.insert(value);
            }
        }
    }
}

// 引入（公有）类型到作用域。
use binary_tree::BinaryTree;

fn main() {
    let mut b = BinaryTree::new();
    b.insert(42);
}
```

</div>

## Passkey 惯用法

在前面的 C++ 示例中，`TreeNode` 的构造函数必须是公有的，以便与 `make_unique` 一起使用。幸运的是，该构造函数在包含类外部仍然不可访问，但并非所有辅助类都能成为内部类。

如果无法做到这一点，可以使用类似[Passkey 惯用法](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/patterns/passkey.md)的编程模式，使构造函数实际上变为私有。

Passkey 惯用法有时也用于比 friend 声明更细粒度地控制成员访问。无论哪种情况，其效果都是通过建模类似能力的系统实现的。

在 Rust 中，也可以表达同样的惯用法以达到相同效果。

<div class="comparison">

```cpp
#include <iostream>
#include <memory>
#include <string>

class Person {
  int age;

  class Passkey {};

public:
  std::string name;

  Person(Passkey, std::string name, int age)
      : name(name), age(age) {}

  static std::unique_ptr<Person>
  createPerson(std::string name, int age) {
    // 其他地方无法使用 make_unique，
    // 因为 Passkey 类型无法被构造。
    return std::make_unique<Person>(Passkey(),
                                    name, age);
  }
};
```

```rust
pub trait Maker<K, B> {
    fn make(passkey: K, args: B) -> Self;
}

// 泛型辅助函数，用于调用本应私有的函数或方法。
fn alloc_thing<K, B, T: Maker<K, B>>(
    passkey: K,
    args: B,
) -> Box<T> {
    Box::new(Maker::<K, B>::make(passkey, args))
}

mod person {
    use super::*;
    use std::marker::PhantomData;

    pub struct Person {
        pub name: String,
        age: u32,
    }

    // 用作 passkey 的零大小类型。
    pub struct Passkey {
        // 该字段为零大小，同时也是私有的，
        // 防止在 person 模块外部构造 Passkey。
        _phantom: PhantomData<()>,
    }

    impl Person {
        // 私有方法，通过 passkey 包装器暴露。
        fn new(name: String, age: u32) -> Person {
            Person { name, age }
        }

        // 使用外部辅助函数的方法，
        // 需要访问另一个本应私有的方法。
        fn alloc(
            name: String,
            age: u32,
        ) -> Box<Person> {
            alloc_thing(
                Passkey {
                    _phantom: PhantomData {},
                },
                MakePersonArgs { name, age },
            )
        }
    }

    // 为实现泛型接口所需的辅助结构体。
    pub struct MakePersonArgs {
        pub name: String,
        pub age: u32,
    }

    // 实现 trait，暴露需要 passkey 的方法。
    impl Maker<Passkey, MakePersonArgs> for Person {
        fn make(
            _passkey: Passkey,
            args: MakePersonArgs,
        ) -> Person {
            Person::new(args.name, args.age)
        }
    }
}
#
# fn main() {}
```

</div>

不过，Passkey 惯用法在 Rust 中很少用到，因为

- 相关类型通常定义在同一个模块中（或者可以用 `pub (in path)` 声明），因此没有必要；
- 它要求接口的调用方配合使用。

第二点与上面涉及 `std::make_unique` 的用法形成对比，后者可以在不知道底层构造函数的情况下转发调用。而下面的例子虽然没有实际用途（因为 `alloc_thing` 不是一个有用的辅助函数），但它确实演示了要实现与 C++ 中该惯用法相同效果时需要定义哪些类型。

## 友元与测试

友元声明的另一个常见用途是让类的内部内容可用于单元测试。虽然在 C++ 中这种做法通常不被推荐，但有时为了测试本应私有的辅助内部类或辅助方法是必要的。

在 Rust 中，测试通常定义在与被测试代码相同的模块中。由于模块内容对子模块可见，这使得模块的所有内容都可以用于测试。

<div class="comparison">

```cpp
// 使用 Boost.Test
// https://www.boost.org/doc/libs/1_84_0/libs/test/doc/html/index.html
#include <string>

class Person {
public:
  std::string name;

private:
  int age;

  friend class PersonTest;

public:
  Person(std::string name, int age)
      : name(name), age(age) {}

  void have_birthday() {
    this->age = this->age + 1;
  }
};

#define BOOST_TEST_MODULE PersonTestModule
#include <boost/test/included/unit_test.hpp>

class PersonTest {
public:
  static void test_have_birthday() {
    Person alice("Alice", 42);
    BOOST_CHECK_EQUAL(alice.age, 42);

    alice.have_birthday();
    BOOST_CHECK_EQUAL(alice.age, 43);
  }
};

BOOST_AUTO_TEST_CASE(have_birthday_test) {
  PersonTest::test_have_birthday();
}
```

```rust
pub struct Person {
    pub name: String,
    age: u32,
}

impl Person {
    pub fn new(name: String, age: u32) -> Person {
        Person { name, age }
    }

    pub fn have_birthday(&mut self) {
        self.age = self.age + 1;
    }
}

#[cfg(test)]
mod test {
    use super::Person;

    #[test]
    fn test_have_birthday() {
        let mut alice =
            Person::new("alice".to_string(), 42);

        assert_eq!(alice.age, 42);
        alice.have_birthday();
        assert_eq!(alice.age, 43);
    }
}
```

</div>

<!-- Rust 的测试将在[单元测试章节](/etc/unit_tests.md)中详细介绍。 -->

## Rust trait 方法的可见性

由于 Rust 中的 trait 旨在定义接口，某个类型由 trait 声明的方法在 trait 和类型都可见时总是可见。换句话说，trait 方法无法设为私有。

trait 方法的默认可见性与 Rust 结构体不同，结构体的默认可见性是限定在定义模块内。

## 私有构造函数与友元

在 C++ 中，可以通过将所有构造函数设为私有，并将允许派生的类声明为友元，从而控制哪些类可以继承某个类。

在 Rust 中，可以通过[密封 trait 模式](https://predr.ag/blog/definitive-guide-to-sealed-traits-in-rust/)实现类似的目标，控制哪些类型可以实现某个 trait。

{{#quiz private_and_friends.toml}}
