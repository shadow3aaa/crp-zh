# 构造函数

在 C++ 中，构造函数用于初始化对象。当构造函数被执行时，对象的存储空间已经分配好，构造函数只负责初始化。

Rust 并没有像 C++ 那样的构造函数。在 Rust 中，创建对象的基本方式是一次性初始化其所有成员。在 Rust 语境下，“构造函数”或“构造方法”更类似于工厂方法：即与类型关联的静态方法（即没有 `self` 参数的方法），返回该类型的一个值。

<div class="comparison">

```cpp
#include <thread>
unsigned int cpu_count() { 
    return std::thread::hardware_concurrency();
}

class ThreadPool {
  unsigned int num_threads;  

public:
  ThreadPool() : num_threads(cpu_count()) {}
  ThreadPool(unsigned int nt) : num_threads(nt) {}
};

int main() {
  ThreadPool p1;
  ThreadPool p2(4);
}
```

```rust
# fn cpu_count() -> usize {
#     std::thread::available_parallelism().unwrap().get()
# }
# 
struct ThreadPool {
  num_threads: usize
}

impl ThreadPool {
    fn new() -> Self {
        Self { num_threads: cpu_count() }
    }

    fn with_threads(nt: usize) -> Self {
        Self { num_threads: nt } 
    }
}

fn main() {
    let p1 = ThreadPool::new();
    let p2 = ThreadPool::with_threads(4);
}
```

</div>

在 Rust 中，通常类型的主构造函数被命名为 `new`，尤其是在它不带参数时。（参见[默认构造函数](./constructors/default_constructors.html)章节。）基于某些特定属性的构造函数通常命名为 `with_<something>`，例如 `ThreadPool::with_threads`。更多命名规范可参考 [Rust 命名指南](https://rust-lang.github.io/api-guidelines/naming.html)。

如果要初始化的字段是可见的，且有合理的默认值，并且该值不管理资源，那么也常用基于某个默认值的记录更新语法来初始化一个值。

```rust
struct Point {
    x: i32,
    y: i32,
    z: i32,
}

impl Point {
    const fn zero() -> Self {
        Self { x: 0, y: 0, z: 0 }
    }
}

fn main() {
    let x_unit = Point {
        x: 1,
        ..Point::zero()
    };
}
```

尽管名字叫“记录更新语法”，但它并不会修改已有记录，而是基于另一个值创建一个新值，并取得其所有权。

## 存储分配与初始化

在 Rust 中，结构体或枚举值的实际构造发生在结构体构造语法 `ThreadPool { ... }` 处，即字段表达式求值之后。

这一差异的重要影响在于，在 Rust 中，结构体的存储空间并不会在构造方法（如 `ThreadPool::with_threads`）被调用时分配，实际上要等到结构体所有字段的值都已计算完成后才分配（从语言语义上讲——优化器可能会避免拷贝）。因此，在 Rust 中没有直接的方式翻译诸如“类在构造时存储自身指针”这样的模式（在 Rust 中，这需要借助 [`Pin`](https://doc.rust-lang.org/std/pin/struct.Pin.html) 和 [`MaybeUninit`](https://doc.rust-lang.org/std/mem/union.MaybeUninit.html) 等工具）。

## 可失败的构造函数

在 C++ 中，构造函数指示失败的主要方式是抛出异常。而在 Rust 中，由于构造函数只是普通的静态方法，可失败的构造函数可以返回 `Result`（类似于 `std::expected`）或 `Option`（类似于 `std::optional`）。

<div class="comparison">

```cpp
#include <iostream>
#include <stdexcept>

class ThreadPool {
  unsigned int num_threads;

public:
  ThreadPool(unsigned int nt) : num_threads(nt) {
    if (num_threads == 0) {
      throw std::domain_error("Cannot have zero threads");
    }
  }
};

int main() {
  try {
    ThreadPool p(0);
  } catch (const std::domain_error &e) {
    std::cout << e.what() << std::endl;
  }
}
```

```rust
struct ThreadPool {
    num_threads: usize,
}

impl ThreadPool {
    fn with_threads(nt: usize) -> Result<Self, String> {
        if nt == 0 {
            Err("Cannot have zero threads".to_string())
        } else {
            Ok(Self { num_threads: nt })
        }
    }
}

fn main() {
    match ThreadPool::with_threads(0) {
        Err(err) => println!("{err}"),        
        Ok(p) => { /* ... */ }
    }
}
```

</div>

更多关于 C++ 异常及其与 Rust 异常处理的对应关系，请参见[异常章节](./exceptions.md)。
