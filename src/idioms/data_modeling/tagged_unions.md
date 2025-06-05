# 标记联合与 `std::variant`

## C 风格标记联合

由于 C++ 中的 union 不能用于类型重解释（type punning），它们通常与一个标签（tag）一起使用，用于区分当前激活的是哪个 union 成员。

Rust 中等价的 union 类型总是带有标签的。它们是 Rust 枚举（enum）的泛化，可以为枚举变体关联额外的数据。

<div class="comparison">

```cpp
enum Tag { Rectangle, Triangle };

struct Shape {
  Tag tag;
  union {
    struct {
      double width;
      double height;
    } rectangle;
    struct {
      double base;
      double height;
    } triangle;
  };

  double area() {
    switch (this->tag) {
    case Rectangle: {
      return this->rectangle.width *
             this->rectangle.height;
    }
    case Triangle: {
      return 0.5 * this->triangle.base *
             this->triangle.height;
    }
    }
  }
};
```

```rust
enum Shape {
    Rectangle { width: f64, height: f64 },
    Triangle { base: f64, height: f64 },
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Rectangle {
                width,
                height,
            } => width * height,
            Shape::Triangle { base, height } => {
                0.5 * base * height
            }
        }
    }
}
```

</div>

在对枚举进行匹配时，Rust 要求必须处理所有枚举变体。在 C++ 中使用 `switch` 时会用 `default`，在 Rust 的 `match` 中可以使用通配符 `_`。

<div class="comparison">

```cpp
$#include <iostream>
$
$enum Tag { Rectangle, Triangle, Circle };
$
$struct Shape {
$  Tag tag;
$  union {
$    struct {
$      double width;
$      double height;
$    } rectangle;
$    struct {
$      double base;
$      double height;
$    } triangle;
$    struct {
$      double radius;
$    } circle;
$  };
$
  void print_shape() {
    switch (this->tag) {
    case Rectangle: {
      std::cout << "Rectangle" << std::endl;
      break;
    }
    default: {
      std::cout << "Some other shape"
                << std::endl;
      break;
    }
    }
  }
};
```

```rust
# enum Shape {
#     Rectangle { width: f64, height: f64 },
#     Triangle { base: f64, height: f64 },
# }
#
impl Shape {
    fn print_shape(&self) {
        match self {
            Shape::Rectangle { .. } => {
                println!("Rectangle");
            }
            _ => {
                println!("Some other shape");
            }
        }
    }
}
```

</div>

Rust 不支持 C++ 风格的 case 穿透（fallthrough），即在进入下一个 case 前可以执行一些操作。但在 Rust 中，可以同时匹配多个枚举变体，只要这些模式绑定的名字和类型一致。

```rust
# enum Shape {
#     Rectangle { width: f64, height: f64 },
#     Triangle { base: f64, height: f64 },
# }
#
impl Shape {
    fn bounding_area(&self) -> f64 {
        match self {
            Shape::Rectangle { height, width }
            | Shape::Triangle {
                height,
                base: width,
            } => width * height,
        }
    }
}
```

## 不检查判别值直接访问成员

与 C 风格联合不同，Rust 总是要求在访问值前先匹配判别值（discriminant）。如果变体已知（例如之前已经检查过），通常可以通过重构代码，将这种知识编码到类型中，这样就可以省略第二次检查（以及相关的错误处理）。

如下 C++ 程序，若要在 Rust 中实现同样的目标，需要对类型做更多的重构。

对应的 Rust 程序需要为 `Shape` 枚举的每个变体定义单独的类型，这样就可以通过让数组的类型为 `Triangle` 而不是 `Shape`，在类型系统中表达所有值都是某一变体。

<div class="comparison">

```cpp
#include <ranges>
#include <vector>

// Uses the same Shape definition.
enum Tag { Rectangle, Triangle };

struct Shape {
  Tag tag;
  union {
    struct {
      double width;
      double height;
    } rectangle;
    struct {
      double base;
      double height;
    } triangle;
  };
};

std::vector<Shape> get_shapes() {
  return std::vector<Shape>{
      Shape{Triangle, {.triangle = {1.0, 1.0}}},
      Shape{Triangle, {.triangle = {1.0, 1.0}}},
      Shape{Rectangle, {.rectangle = {1.0, 1.0}}},
  };
}

std::vector<Shape> get_shapes();

int main() {
  std::vector<Shape> shapes = get_shapes();

  auto is_triangle = [](Shape shape) {
    return shape.tag == Triangle;
  };

  // Create an iterator that only sees the
  // triangles. (std::views::filter is from C++20,
  // but the same effect can be acheived with a
  // custom iterator.)
  auto triangles =
      shapes | std::views::filter(is_triangle);

  double total_base = 0.0;
  for (auto &triangle : triangles) {
    // Skip checking the tag because we know we
    // have only triangles.
    total_base += triangle.triangle.base;
  }

  return 0;
}
```

```rust
// 为每个变体定义单独的结构体。
struct Rectangle { width: f64, height: f64 }
struct  Triangle { base: f64, height: f64 }

enum Shape {
    Rectangle(Rectangle),
    Triangle(Triangle),
}

fn get_shapes() -> Vec<Shape> {
    vec![
        Shape::Triangle(Triangle {
            base: 1.0,
            height: 1.0,
        }),
        Shape::Triangle(Triangle {
            base: 1.0,
            height: 1.0,
        }),
        Shape::Rectangle(Rectangle {
            width: 1.0,
            height: 1.0,
        }),
    ]
}

fn main() {
    let shapes = get_shapes();

    // 该迭代器只遍历三角形，
    // 并且类型就是 Triangle 而不是 Shape。
    let triangles = shapes
        .iter()
        // 只保留三角形
        .filter_map(|shape| match shape {
            Shape::Triangle(t) => Some(t),
            _ => None,
        });

    let mut total_base = 0.0;
    for triangle in triangles {
        // 因为迭代器产生的是 Triangle，
        // 所以可以直接访问 base 字段。
        total_base += triangle.base;
    }
}
```

</div>

这种用法在 Rust 中很常见，因此变体通常一开始就设计为拥有自己的类型。

这种做法在 C++ 中同样可行，且在 C++17 及以后版本中常与 `std::variant` 一起使用。

## `std::variant`（自 C++17 起）

在 C++17 及以后标准中，可以用 `std::variant` 来表示带标签的联合体，这种方式与 Rust 的枚举更为相似。

```cpp
#include <variant>

struct Rectangle {
  double width;
  double height;
};

struct Triangle {
  double base;
  double height;
};

using Shape = std::variant<Rectangle, Triangle>;

double area(const Shape &shape) {
  return std::visit(
      [](auto &&arg) -> double {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, Rectangle>) {
          return arg.width * arg.height;
        } else if constexpr (std::is_same_v<T, Triangle>) {
          return 0.5 * arg.base * arg.height;
        }
      },
      shape);
}
```

由于 Rust 不依赖模板实现该语言特性，因此当遗漏变体或新增变体时，错误信息更易读，这消除了使用标记联合体的障碍之一。对比 C++（gcc）和 Rust 在遗漏 `Triangle` 分支时的错误信息。

下面两个程序有相同的错误：都没有处理 `Shape` 的所有情况。

<div class="comparison">

```cpp
#include <variant>

struct Rectangle {
  double width;
  double height;
};

struct Triangle {
  double base;
  double height;
};

using Shape = std::variant<Rectangle, Triangle>;

double area(const Shape &shape) {
  return std::visit(
      [](auto &&arg) -> double {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, Rectangle>) {
          return arg.width * arg.height;
        }
      },
      shape);
}
```

```rust,ignore
enum Shape {
    Rectangle { width: f64, height: f64 },
    Triangle { base: f64, height: f64 },
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Rectangle {
                width,
                height,
            } => width * height,
        }
    }
}
```

</div>

但两者的错误信息有很大不同。

<div class="comparison">

```text
example.cc: In instantiation of ‘area(const Shape&)::<lambda(auto:27&&)> [with auto:27 = const Triangle&]’:
/usr/include/c++/14.2.1/bits/invoke.h:61:36:   required from ‘constexpr _Res std::__invoke_impl(__invoke_other, _Fn&&, _Args&& ...) [with _Res = double; _Fn = area(const Shape&)::<lambda(auto:27&&)>; _Args = {const Triangle&}]’
   61 |     { return std::forward<_Fn>(__f)(std::forward<_Args>(__args)...); }
      |              ~~~~~~~~~~~~~~~~~~~~~~^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/usr/include/c++/14.2.1/bits/invoke.h:96:40:   required from ‘constexpr typename std::__invoke_result<_Functor, _ArgTypes>::type std::__invoke(_Callable&&, _Args&& ...) [with _Callable = area(const Shape&)::<lambda(auto:27&&)>; _Args = {const Triangle&}; typename __invoke_result<_Functor, _ArgTypes>::type = double]’
   96 |       return std::__invoke_impl<__type>(__tag{}, std::forward<_Callable>(__fn),
      |              ~~~~~~~~~~~~~~~~~~~~~~~~~~^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   97 |                                         std::forward<_Args>(__args)...);
      |                                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/usr/include/c++/14.2.1/variant:1060:24:   required from ‘static constexpr decltype(auto) std::__detail::__variant::__gen_vtable_impl<std::__detail::__variant::_Multi_array<_Result_type (*)(_Visitor, _Variants ...)>, std::integer_sequence<long unsigned int, __indices ...> >::__visit_invoke(_Visitor&&, _Variants ...) [with _Result_type = std::__detail::__variant::__deduce_visit_result<double>; _Visitor = area(const Shape&)::<lambda(auto:27&&)>&&; _Variants = {const std::variant<Rectangle, Triangle>&}; long unsigned int ...__indices = {1}]’
  1060 |           return std::__invoke(std::forward<_Visitor>(__visitor),
      |                  ~~~~~~~~~~~~~^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  1061 |               __element_by_index_or_cookie<__indices>(
      |               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  1062 |                 std::forward<_Variants>(__vars))...);
      |                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/usr/include/c++/14.2.1/variant:1820:5:   required from ‘constexpr decltype(auto) std::__do_visit(_Visitor&&, _Variants&& ...) [with _Result_type = __detail::__variant::__deduce_visit_result<double>; _Visitor = area(const Shape&)::<lambda(auto:27&&)>; _Variants = {const variant<Rectangle, Triangle>&}]’
  1820 |                   _GLIBCXX_VISIT_CASE(1)
      |                   ^~~~~~~~~~~~~~~~~~~
/usr/include/c++/14.2.1/variant:1882:34:   required from ‘constexpr std::__detail::__variant::__visit_result_t<_Visitor, _Variants ...> std::visit(_Visitor&&, _Variants&& ...) [with _Visitor = area(const Shape&)::<lambda(auto:27&&)>; _Variants = {const variant<Rectangle, Triangle>&}; __detail::__variant::__visit_result_t<_Visitor, _Variants ...> = double]’
  1882 |             return std::__do_visit<_Tag>(
      |                    ~~~~~~~~~~~~~~~~~~~~~^
  1883 |               std::forward<_Visitor>(__visitor),
      |               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  1884 |               static_cast<_Vp>(__variants)...);
      |               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
example.cc:17:20:   required from here
   17 |   return std::visit(
      |          ~~~~~~~~~~^
   18 |       [](auto &&arg) -> double {
      |       ~~~~~~~~~~~~~~~~~~~~~~~~~~
   19 |         using T = std::decay_t<decltype(arg)>;
      |         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   20 |         if constexpr (std::is_same_v<T, Rectangle>) {
      |         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   21 |           return arg.width * arg.height;
      |           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   22 |         }
      |         ~
   23 |       },
      |       ~~
   24 |       shape);
      |       ~~~~~~
example.cc:23:7: error: no return statement in ‘constexpr’ function returning non-void
   23 |       },
      |       ^
example.cc: In lambda function:
example.cc:23:7: warning: control reaches end of non-void function [-Wreturn-type]
```

```text
error[E0004]: non-exhaustive patterns: `&Shape::Triangle { .. }` not covered
 --> example.rs:8:15
  |
8 |         match self {
  |               ^^^^ pattern `&Shape::Triangle { .. }` not covered
  |
note: `Shape` defined here
 --> example.rs:1:6
  |
1 | enum Shape {
  |      ^^^^^
2 |     Rectangle { width: f64, height: f64 },
3 |     Triangle { base: f64, height: f64 },
  |     -------- not covered
= note: the matched value is of type `&Shape`
help: ensure that all possible cases are being handled by adding a match arm with a wildcard pattern or an explicit pattern as shown
  |
12~             } => width * height,
13~             &Shape::Triangle { .. } => todo!(),
  |
```

</div>

## 使用 unsafe Rust 避免判别值检查

如果无法重构代码采用[上述方式](#accessing-the-value-without-checking-the-discriminant)，可以先检查判别值，然后用 [`unreachable!` 宏](https://doc.rust-lang.org/std/macro.unreachable.html) 来避免处理不可能的分支。但这仍然涉及实际的判别值检查。如果必须避免判别值检查的开销，可以使用 [unsafe 函数 `unreachable_unchecked`](https://doc.rust-lang.org/std/hint/fn.unreachable_unchecked.html)，既避免了分支处理，也告诉编译器该分支不可达，从而让优化器消除判别值检查。

类似于 C++ 示例中访问未激活变体是未定义行为，执行到 `unreachable_unchecked` 也是未定义行为。

```rust
# enum Shape {
#     Rectangle { width: f64, height: f64 },
#     Triangle { base: f64, height: f64 },
# }
#
# impl Shape {
#     fn area(&self) -> f64 {
#         match self {
#             Shape::Rectangle {
#                 width,
#                 height,
#             } => width * height,
#             Shape::Triangle { base, height } => {
#                 0.5 * base * height
#             }
#         }
#     }
# }
#
# fn get_triangles() -> Vec<Shape> {
#     vec![
#         Shape::Triangle {
#             base: 1.0,
#             height: 1.0,
#         },
#         Shape::Triangle {
#             base: 1.0,
#             height: 1.0,
#         },
#     ]
# }
#
use std::hint::unreachable_unchecked;

fn main() {
    let mut total_base = 0.0;
    for triangle in get_triangles() {
        match triangle {
            Shape::Triangle { base, .. } => {
                total_base += base;
            }
            _ => unsafe {
                unreachable_unchecked();
            },
        }
    }
}
```

{{#quiz tagged_unions.toml}}
