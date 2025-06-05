# 对象标识

在 C++ 中，对象的指针有时被用来表示其在程序逻辑中的身份。

在某些情况下，这是一种标准优化，例如实现拷贝赋值运算符时。

在其他情况下，指针值被用作逻辑身份，以区分那些属性相同但实例不同的对象。例如，在表示带标签的图时，可能存在具有相同标签但不同的节点实例。

在 Rust 中，这些用法有些并不适用，其他情况则通常通过为值实现一种“合成身份”来处理。

## 重载拷贝赋值与相等比较运算符

例如，在实现拷贝赋值运算符时，可以在被赋值对象和赋值源对象为同一对象时直接返回。注意，这种用法下指针值并不会被存储。

在实现 [Rust 的拷贝赋值等价物](./constructors/copy_and_move_constructors.md#assignment-operators) `Clone::clone_from` 时，这类优化是不必要的。`Clone::clone_from` 的类型签名保证了同一个对象不会同时作为两个参数传入，因为其中一个参数是独占的可变引用，这样就阻止了另一个引用参数指向同一对象。

<div class="comparison">

```cpp
struct Person
{
    std::string name;
    // 许多其他复制开销较大的字段

    Person& operator=(const Person& other) {
        // 首先比较对象标识
        if (this != &other) {
            this.name = other.name;
            // 复制其他复制开销较大的字段
        }

        return *this;
    }
};
```

```rust
struct Person {
    name: String,
}

impl Clone for Person {
    fn clone(&self) -> Self {
        Self { name: self.name.clone() }
    }

    fn clone_from(&mut self, source: &Self) {
        // self 和 source 不可能相同，
        // 因为这意味着同一内存位置同时有
        // 可变引用和不可变引用。
        // 因此，这里无需做自赋值检查，
        // 即使是出于优化目的。

        self.name.clone_from(&source.name);
    }
}
```

</div>

在 C++ 中，如果大多数比较都是对象与自身的比较（例如对象主要用于哈希集合），且不相等对象的比较开销很大，则可以通过比较对象标识来优化相等比较运算符的重载。

在 Rust 中，如需支持类似操作，可以使用 [`std::ptr::eq`](https://doc.rust-lang.org/std/ptr/fn.eq.html)。

<div class="comparison">

```cpp
struct Person
{
    std::string name;
    // 许多其他比较开销较大的字段
};


bool operator==(const Person& lhs, const Person& rhs) {
    // 首先比较对象标识
    if (&lhs == &rhs) {
        return true;
    }

    // 比较其他比较开销较大的字段

    return true;
}
```

```rust
struct Person {
    name: String,
    // 许多其他比较开销较大的字段
}

impl PartialEq for Person {
    fn eq(&self, other: &Self) -> bool {
        if std::ptr::eq(self, other) {
            return true;
        }
        // 比较其他比较开销较大的字段

        true
    }
}

impl Eq for Person {}
```

</div>

## 在关系结构中区分值

另一种用法是，当值之间的关系通过外部数据结构表示时，例如在表示带标签的图时，多个节点可能有相同的标签，但它们与其他节点的连接关系不同。这与前面的情况不同，因为这里会保留指针值。

一个现实中的例子是在 LLVM 代码库中，AST 中声明、语句和表达式的出现通过对象标识来区分。例如，变量表达式（`class DeclRefExpr`）包含了[指向其所引用声明的指针](https://github.com/llvm/llvm-project/blob/ddc48fefe389789f64713b5924a03fb2b7961ef3/clang/include/clang/AST/Expr.h#L1265C1-L1275C16)。

类似地，在比较两个变量声明是否代表同一个变量声明时，会[使用指向某个规范 `VarDecl` 的指针](https://github.com/llvm/llvm-project/blob/aa33c095617400a23a2b814c4defeb12e7761639/clang/lib/AST/Stmt.cpp#L1476-L1485)：

```cpp
VarDecl *VarDecl::getCanonicalDecl();

bool CapturedStmt::capturesVariable(const VarDecl *Var) const {
  for (const auto &I : captures()) {
    if (!I.capturesVariable() && !I.capturesVariableByCopy())
      continue;
    if (I.getCapturedVar()->getCanonicalDecl() == Var->getCanonicalDecl())
      return true;
  }

  return false;
}
```

这种用法在 C++ 中通常不被推荐，因为容易引发悬垂指针等 use-after-free 问题，但在对性能要求极高的场景下，如果存储映射关系或通过间接方式解析实体身份的开销过高，可能会采用这种方式。

在 Rust 中，通常推荐用合成标识符来表示对象身份。这也是建模自引用数据结构的一种技术。

例如，流行的 Rust 图结构库 [petgraph](https://docs.rs/petgraph/latest/petgraph/) 默认使用 `u32` 作为节点标识类型。这会带来一次额外的查找以通过标识符获取节点标签，以及存储节点到标签映射所需的额外内存开销。

使用相同合成标识符技术的简化图结构如下，通过节点在标签和边的向量中的索引来表示节点身份：

```rust
enum Color {
    Red,
    Blue
}

struct Graph {
    /// 从节点 id 到节点标签（此处为颜色）的映射
    nodes_labels: Vec<Color>,

    /// 从节点 id 到相邻节点 id 的映射
    edges: Vec<Vec<usize>>,
}
```

如果性能需求无法接受合成标识符的开销，则可能需要防止值被移动。可以使用 [`Pin` 和 `PhantomPinned` 结构体](https://doc.rust-lang.org/std/pin/index.html) 来实现类似于 C++ 中删除移动构造函数的效果。

{{#quiz object_identity.toml}}
