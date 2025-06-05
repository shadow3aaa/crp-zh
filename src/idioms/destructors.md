# 析构函数与资源清理

在 C++ 中，类 `T` 的析构函数通过特殊成员函数 `~T()` 定义。要在 Rust 中实现类似功能，需要为类型实现 [`Drop` trait](https://doc.rust-lang.org/std/ops/trait.Drop.html)。

例如，参见[拷贝与移动构造函数章节](./constructors/copy_and_move_constructors.md#user-defined-constructors)。

对于管理资源的类型，`Drop` 的实现与 C++ 的析构函数作用相同。也就是说，它们允许在值生命周期结束时清理其所拥有的资源。

在 Rust 中，当拥有某个值的变量离开作用域时，会由析构器自动调用该值的 `Drop::drop` 方法。与 C++ 不同，drop 方法不能被手动调用。自动的“drop glue”会隐式地调用字段的析构函数。

## 生命周期与析构函数

C++ 中，变量离开作用域时会以与构造顺序相反的顺序调用析构函数；对于动态分配的对象，则在被删除时调用。这包括已被移动的对象的析构函数。

在 Rust 中，销毁顺序与 C++ 类似（按声明的逆序）。如果需要更具体的销毁顺序细节（如编写不安全代码时），可参考[语言参考](https://doc.rust-lang.org/reference/destructors.html)中的完整规则。然而，在 Rust 中，移动对象不会留下一个“已被移动”的对象，因此不会再对其调用析构函数。

<div class="comparison">

```cpp
#include <iostream>
#include <utility>

struct A {
  int id;

  A(int id) : id(id) {}

  // 拷贝构造函数
  A(A &other) : id(other.id) {}

  // 移动构造函数
  A(A &&other) : id(other.id) {
    other.id = 0;
  }

  // 析构函数
  ~A() {
    std::cout << id << std::endl;
  }
};

int accept(A x) {
  return x.id;
} // x 的析构函数会在 return 表达式求值后调用

// 输出：
// 2
// 3
// 0
// 1
int main() {
  A x(1);
  A y(2);

  accept(std::move(y));

  A z(3);

  return 0;
}
```

```rust
struct A {
    id: i32,
}

impl Drop for A {
    fn drop(&mut self) {
        println!("{}", self.id)
    }
}

fn accept(x: A) -> i32 {
    return x.id;
}

// 输出：
// 2
// 3
// 1
fn main() {
    let x = A { id: 1 };
    let y = A { id: 2 };

    accept(y);

    let z = A { id: 3 };
}
```

</div>

在 Rust 中，将 `y` 的所有权移动到函数 `accept` 后，不会有额外的对象残留，因此不会有额外的 `Drop::drop` 调用（而在 C++ 示例中会打印 `0`）。

Rust 的 drop 方法在因 panic 离开作用域时也会运行，但如果 panic 发生在响应初始 panic 而调用的析构函数中，则不会运行。

## 提前清理与显式销毁值

在 C++ 中，可以显式销毁一个对象。这主要用于通过 placement new 在特定内存位置分配对象的场景，此时析构函数不会被自动调用。

然而，一旦析构函数被显式调用，[它可能不会再次被调用，即使是隐式的](https://eel.is/c++draft/class.dtor#note-8)。因此，析构函数不能用于提前清理。相反，要么类需要设计一个单独的清理方法来释放资源但保持对象可析构，要么使用该对象的函数结构应确保变量在期望的时机离开作用域。

在 Rust 中，可以通过 [`std::mem::drop`](https://doc.rust-lang.org/std/mem/fn.drop.html) 提前销毁值以实现提前清理。这是因为（[对于非 `Copy` 类型](./constructors/copy_and_move_constructors.md#trivially-copyable-types)）对象的所有权实际上被转移给了 `std::mem::drop` 函数，因此在 `std::mem::drop` 的生命周期结束时会调用 `Drop::drop`。

因此，`std::mem::drop` 可用于提前清理资源，而无需通过调整函数结构让变量提前离开作用域。

例如，下面的代码在堆上分配了一个大向量，并在分配第二个大向量前显式销毁第一个，从而减少了整体内存占用。

```rust
fn main() {
    let v = vec![0u32; 100000];
    // ... 使用 v

    std::mem::drop(v);
    // 此处 v 已不可用

    let v2 = vec![0u32; 100000];
    // ... 使用 v2
}
```

{{#quiz destructors.toml}}
