# 模板类、函数与方法

C++ 中模板最常见的用途是定义可用于任意类型（或至少是提供某些方法的类型）的类、方法、特性或函数。这种用法在 STL 的容器类（如 `<vector>`）和算法库（`<algorithm>`）中非常常见。

下面的例子定义了一个以邻接表表示的有向图模板，其中图的节点标签类型是泛型的。虽然示例展示的是模板类，但与 Rust 的比较同样适用于模板方法和模板函数。

在 Rust 中，可以使用泛型类型实现同样可复用的代码。

<div class="comparison">

```cpp
#include <stdexcept>
#include <vector>

template <typename Label>
class DirectedGraph {
  std::vector<std::vector<size_t>> adjacencies;
  std::vector<Label> nodeLabels;

public:
  size_t addNode(Label label) {
    adjacencies.push_back(std::vector<size_t>());
    nodeLabels.push_back(label);
    return numNodes() - 1;
  }

  void addEdge(size_t from, size_t to) {
    size_t numNodes = this->numNodes();
    if (from >= numNodes || to >= numNodes) {
      throw std::invalid_argument(
          "Node index out of range");
    }
    adjacencies[from].push_back(to);
  }

  size_t numNodes() const {
    return adjacencies.size();
  }
};
```

```rust
pub struct DirectedGraph<Label> {
    adjacencies: Vec<Vec<usize>>,
    node_labels: Vec<Label>,
}

impl<Label> DirectedGraph<Label> {
    pub fn new() -> Self {
        DirectedGraph {
            adjacencies: Vec::new(),
            node_labels: Vec::new(),
        }
    }

    pub fn add_node(
        &mut self,
        label: Label,
    ) -> usize {
        self.adjacencies.push(Vec::new());
        self.node_labels.push(label);
        self.num_nodes() - 1
    }

    pub fn add_edge(
        &mut self,
        from: usize,
        to: usize,
    ) -> Result<(), &str> {
        let num_nodes = self.num_nodes();
        if from >= num_nodes || to >= num_nodes {
            Err("Node index out of range.")
        } else {
            self.adjacencies[from].push(to);
            Ok(())
        }
    }

    pub fn num_nodes(&self) -> usize {
        self.node_labels.len()
    }
}
```

</div>

在上述示例中，使用 C++ 模板定义类和使用 Rust 泛型定义结构体在实际应用上几乎没有区别。无论在 C++ 中使用 `typename` 或 `class` 参数的模板，还是在 Rust 中使用类型参数，效果都是类似的。

## 针对参数化类型的操作

当尝试对值进行操作时，两者的差异会更加明显。下面的代码为 Rust 和 C++ 的例子都添加了一个获取图中最小节点的方法。

<div class="comparison">

```cpp
#include <optional>
#include <stdexcept>
#include <vector>

template <typename Label>
class DirectedGraph {
  std::vector<std::vector<size_t>> adjacencies;
  std::vector<Label> nodeLabels;

public:
  size_t addNode(Label label) {
    adjacencies.push_back(std::vector<size_t>());
    nodeLabels.push_back(label);
    return numNodes() - 1;
  }

  void addEdge(size_t from, size_t to) {
    size_t numNodes = this->numNodes();
    if (from >= numNodes || to >= numNodes) {
      throw std::invalid_argument(
          "Node index out of range");
    }
    adjacencies[from].push_back(to);
  }

  size_t numNodes() const {
    return adjacencies.size();
  }

  std::optional<size_t> smallestNode() {
    if (nodeLabels.empty()) {
      return std::nullopt;
    }
    Label &least = nodeLabels[0];
    size_t index = 0;

    for (int i = 1; i < nodeLabels.size(); i++) {
      if (least > nodeLabels[i]) {
        least = nodeLabels[i];
        index = i;
      }
    }
    return std::optional(index);
  }
};
```

```rust
# pub struct DirectedGraph<Label> {
#     adjacencies: Vec<Vec<usize>>,
#     node_labels: Vec<Label>,
# }
#
impl<Label> DirectedGraph<Label> {
#     pub fn new() -> Self {
#         DirectedGraph {
#             adjacencies: Vec::new(),
#             node_labels: Vec::new(),
#         }
#     }
#
#     pub fn add_node(
#         &mut self,
#         label: Label,
#     ) -> usize {
#         self.adjacencies.push(Vec::new());
#         self.node_labels.push(label);
#         self.num_nodes() - 1
#     }
#
#     pub fn num_nodes(&self) -> usize {
#         self.node_labels.len()
#     }
#
#     pub fn add_edge(
#         &mut self,
#         from: usize,
#         to: usize,
#     ) -> Result<(), &str> {
#         if from > self.num_nodes()
#             || to > self.num_nodes()
#         {
#             Err("Node not in graph.")
#         } else {
#             self.adjacencies[from].push(to);
#             Ok(())
#         }
#     }
    pub fn smallest_node(&self) -> Option<usize>
    where
        Label: Ord,
    {
        // 这与 C++ 实现一致，但不是最惯用的实现方式！
        if self.node_labels.is_empty() {
            None
        } else {
            let mut least = &self.node_labels[0];
            let mut index = 0;
            for i in 1..self.node_labels.len() {
                if *least > self.node_labels[i] {
                    least = &self.node_labels[i];
                    index = i;
                }
            }
            Some(index)
        }
    }
}
```

</div>

这两种实现的主要区别在于，C++ 版本直接对值使用 `operator>`，而不关心该类型是否定义了该操作符。而 Rust 版本则要求 `Label` 类型实现 `Ord` trait。（关于 Rust trait 及其与 C++ 概念的关系，详见[概念、接口与静态分发](./concepts.md)章节。）

与 C++ 模板不同，Rust 的泛型定义会在定义时进行类型检查，而不是在使用时。这意味着如果要对类型参数的值进行操作，必须对参数加以 trait 约束。如上例所示，类似于 C++ 的 concepts 和 `requires`，约束可以只要求在特定方法上，而不是整个泛型类。

Rust 的最佳实践是将 trait 约束放在真正需要的地方，以提升类型的灵活性。

顺带一提，更惯用的 Rust `smallest_node` 实现会利用迭代器。这种风格可能需要 C++ 程序员适应。

```rust
# pub struct DirectedGraph<Label> {
#     adjacencies: Vec<Vec<usize>>,
#     node_labels: Vec<Label>,
# }
#
impl<Label> DirectedGraph<Label> {
#     pub fn new() -> Self {
#         DirectedGraph {
#             adjacencies: Vec::new(),
#             node_labels: Vec::new(),
#         }
#     }
#
#     pub fn add_node(
#         &mut self,
#         label: Label,
#     ) -> usize {
#         self.adjacencies.push(Vec::new());
#         self.node_labels.push(label);
#         self.num_nodes() - 1
#     }
#
#     pub fn num_nodes(&self) -> usize {
#         self.node_labels.len()
#     }
#
#     pub fn add_edge(
#         &mut self,
#         from: usize,
#         to: usize,
#     ) -> Result<(), &str> {
#         if from > self.num_nodes()
#             || to > self.num_nodes()
#         {
#             Err("Node not in graph.")
#         } else {
#             self.adjacencies[from].push(to);
#             Ok(())
#         }
#     }
    pub fn smallest_node(&self) -> Option<usize>
    where
        Label: Ord,
    {
        self.node_labels
            .iter()
            .enumerate()
            .map(|(i, l)| (l, i))
            .min()
            .map(|(_, i)| i)
    }
}
```

更惯用的实现还可以利用 [itertools crate](https://docs.rs/itertools/latest/itertools/trait.Itertools.html#method.position_min)。

```rust,ignore
use itertools::*;

# pub struct DirectedGraph<Label> {
#     adjacencies: Vec<Vec<usize>>,
#     node_labels: Vec<Label>,
# }
#
impl<Label> DirectedGraph<Label> {
#     pub fn new() -> Self {
#         DirectedGraph {
#             adjacencies: Vec::new(),
#             node_labels: Vec::new(),
#         }
#     }
#
#     pub fn add_node(
#         &mut self,
#         label: Label,
#     ) -> usize {
#         self.adjacencies.push(Vec::new());
#         self.node_labels.push(label);
#         self.num_nodes() - 1
#     }
#
#     pub fn num_nodes(&self) -> usize {
#         self.node_labels.len()
#     }
#
#     pub fn add_edge(
#         &mut self,
#         from: usize,
#         to: usize,
#     ) -> Result<(), &str> {
#         if from > self.num_nodes()
#             || to > self.num_nodes()
#         {
#             Err("Node not in graph.")
#         } else {
#             self.adjacencies[from].push(to);
#             Ok(())
#         }
#     }
#
    pub fn smallest_node(&self) -> Option<usize>
    where
        Label: Ord,
    {
        self.node_labels.iter().position_min()
    }
}
```

## `constexpr` 模板参数

Rust 也支持类似于 C++ `constexpr` 模板参数的功能。例如，可以定义一个泛型函数，返回一个从指定值开始、长度在编译期确定的连续整数数组。

<div class="comparison">

```cpp
#include <array>
#include <cstddef>

template <size_t N>
std::array<int, N>
makeSequentialArray(int start) {
  std::array<int, N> arr;
  for (size_t i = 0; i < N; i++) {
    arr[i] = start + i;
  }
}
```

```rust
fn make_sequential_array<const N: usize>(
    start: i32,
) -> [i32; N] {
    std::array::from_fn(|i| start + i as i32)
}
```

</div>

对应的 Rust 惯用写法使用了辅助函数 `std::array::from_fn` 来构造数组。`from_fn` 本身的类型参数包括元素类型和常量，这些参数可以省略，因为 Rust 能根据返回数组的类型自动推断。

## Rust 的 `Self` 类型

在 Rust 的结构体定义、`impl` 块或 `impl` trait 块中，`Self` 类型始终在作用域内。`Self` 表示当前正在定义的类型，且所有泛型参数都已填充。尤其在参数较多时，引用该类型会很方便。

在定义泛型 trait 时，`Self` 类型是必须的，用于指代具体实现类型。由于 Rust 没有具体类型之间的继承，也没有方法重写，这样的设计足以避免需要将实现类型作为类型参数传递。

相关示例可参考[奇异递归模板模式](../../patterns/crtp.md#method-chaining)章节。

## 关于类型检查与类型错误的说明

泛型类型在定义时而非模板展开时进行检查，这影响了错误检测的时机和错误报告的方式。即使在 C++ 中始终使用 concepts 声明所需操作，也无法完全实现 Rust 的这种行为。

例如，可能会不小心将 `nodeLabels` 成员声明为 `size_t` 向量，而不是标签参数类型的向量。如果所有测试用例的标签类型都能隐式转换为整数，这个错误就不会被发现。

而类似的 Rust 程序即使没有实例化泛型结构体，也会在编译时失败，并给出有用的错误信息。

<div class="comparison">

```cpp
#include <stdexcept>
#include <vector>

template <typename Label>
class DirectedGraph {
  // 错误在这里：size_t 应为 Label
  std::vector<std::vector<size_t>> adjacencies;
  std::vector<size_t> nodeLabels;

public:
  Label getNode(size_t nodeId) {
    return nodeLabels[nodeId];
  }

  size_t addNode(Label label) {
    adjacencies.push_back(std::vector<size_t>());
    nodeLabels.push_back(label);
    return numNodes() - 1;
  }

  size_t numNodes() const {
    return adjacencies.size();
  }
};

#define BOOST_TEST_MODULE DirectedGraphTests
#include <boost/test/included/unit_test.hpp>

BOOST_AUTO_TEST_CASE(test_add_node_int) {
  DirectedGraph<int> g;
  auto n1 = g.addNode(1);
  BOOST_CHECK_EQUAL(1, g.getNode(n1));
}

BOOST_AUTO_TEST_CASE(test_add_node_float) {
  DirectedGraph<float> g;
  float label = 1.0f;
  auto n1 = g.addNode(label);
  BOOST_CHECK_CLOSE(label, g.getNode(n1), 0.0001);
}
```

```rust,ignore
pub struct DirectedGraph<Label> {
    // 错误在这里：size_t 应为 Label
    adjacencies: Vec<Vec<usize>>,
    node_labels: Vec<usize>,
}

impl<Label> DirectedGraph<Label> {
    pub fn new() -> Self {
        DirectedGraph {
            adjacencies: Vec::new(),
            node_labels: Vec::new(),
        }
    }

    pub fn get_node(
        &self,
        node_id: usize,
    ) -> Option<&Label> {
        self.node_labels.get(node_id)
    }

    pub fn add_node(
        &mut self,
        label: Label,
    ) -> usize {
        self.adjacencies.push(Vec::new());
        self.node_labels.push(label);
        self.num_nodes() - 1
    }

    pub fn num_nodes(&self) -> usize {
        self.node_labels.len()
    }
}
```

</div>

尽管存在错误，C++ 示例仍能编译并通过测试。

```text
Running 2 test cases...

*** No errors detected
```

即使没有测试用例，Rust 示例也无法编译，并会给出有助于定位错误的提示信息。

```text
error[E0308]: mismatched types
    --> example.rs:26:31
     |
6    | impl<Label> DirectedGraph<Label> {
     |      ----- found this type parameter
...
26   |         self.node_labels.push(label);
     |                          ---- ^^^^^ expected `usize`, found type parameter `Label`
     |                          |
     |                          arguments to this method are incorrect
     |
     = note:        expected type `usize`
             found type parameter `Label`
```

## 生命周期参数

Rust 的泛型也可用于对引用的生命周期进行泛型化。与其他类型参数不同，使用不同生命周期的函数不会导致编译出的代码有多份，因为生命周期不会影响运行时表现。

关于生命周期与 Rust 泛型的交互，详见[概念章节相关内容](./concepts.md#generics-and-lifetimes)。

## 条件编译

C++ 模板与 Rust 泛型的一个重要区别在于，C++ 模板实际上是一种更通用的宏语言，支持条件编译（如结合 `if constexpr`、`requires` 或 `std::enable_if` 使用）。Rust 则通过宏系统支持这些用例，其实现方式与 C++ 有很大不同。最常见的条件编译方式是通过 [`cfg` 属性和 `cfg!` 宏](https://doc.rust-lang.org/rust-by-example/attribute/cfg.html)。

Rust 将条件编译与泛型分离，这与 Rust 不支持[模板特化](./template_specialization.md)的设计考虑类似。

{{#quiz templates.toml}}
