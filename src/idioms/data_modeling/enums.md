# 枚举（Enums）

在 C++ 中，枚举常用于建模一组固定的备选项，尤其是在每个枚举值都对应特定整数值的场景，例如硬件操作、系统调用或协议实现。

例如，GPIO 引脚的各种模式可以用枚举来建模，这样可以限制相关方法只接受有效的模式值。

虽然 Rust 的枚举[更为通用](./tagged_unions.md)，但它们同样适用于此类建模。

<div class="comparison">

```cpp
#include <cstdint>

enum Pin : uint8_t {
  Pin1 = 0x01,
  Pin2 = 0x02,
  Pin3 = 0x04
};

enum Mode : uint8_t {
  Output = 0x03,
  Pullup = 0x04,
  Analog = 0x27
  // ...
};

void low_level_set_pin(uint8_t pin, uint8_t mode);

void set_pin_mode(Pin pin, Mode mode) {
  low_level_set_pin(pin, mode);
}
```

```rust
#[repr(u8)]
#[derive(Clone, Copy)]
enum Pin {
    Pin1 = 0x01,
    Pin2 = 0x02,
    Pin3 = 0x04,
}

#[repr(u8)]
#[derive(Clone, Copy)]
enum Mode {
    Output = 0x03,
    Pullup = 0x04,
    Analog = 0x27,
    // ...
}

extern "C" {
    fn low_level_set_pin(pin: u8, mode: u8);
}

fn set_pin_mode(pin: Pin, mode: Mode) {
    unsafe {
        low_level_set_pin(pin as u8, mode as u8)
    };
}
```

</div>

`#[repr(u8)]` 属性确保枚举的内存布局与字节类型一致（类似于 C++ 中声明枚举的底层类型）。这样，枚举值就可以通过 `as` 关键字自由转换为底层类型。

在 C++ 中，将整数转换为枚举的标准方式是使用 static_cast。然而，这[要求用户自行检查转换的有效性](https://eel.is/c++draft/expr.static.cast#10)。通常，这种转换会通过一个函数来实现，该函数会检查待转换值是否为有效的枚举值。

在 Rust 中，标准做法是为该类型实现 `TryFrom` trait，然后使用 `try_from` 或 `try_into` 方法进行转换。

<div class="comparison">

```cpp
#include <cstdint>

enum Pin : uint8_t {
  Pin1 = 0x01,
  Pin2 = 0x02,
  Pin3 = 0x04
};

struct InvalidPin {
    uint8_t pin;
};

Pin to_pin(uint8_t pin) {
  // 这些值不是连续的，因此不能只检查范围后直接转换。
  switch (pin) {
  case 0x1: { return Pin1; }
  case 0x2: { return Pin2; }
  case 0x4: { return Pin3; }
  }
  throw InvalidPin{pin};
}

int main() {
  try {
    Pin p(to_pin(2));
  } catch (InvalidPin &e) {
    return 0;
  }

  // 使用 pin p
}
```

```rust
# #[repr(u8)]
# #[derive(Clone, Copy)]
# enum Pin {
#     Pin1 = 0x01,
#     Pin2 = 0x02,
#     Pin3 = 0x04,
# }
#
use std::convert::TryFrom;

struct InvalidPin(u8);

impl TryFrom<u8> for Pin {
    type Error = InvalidPin;

    fn try_from(
        value: u8,
    ) -> Result<Self, Self::Error> {
        match value {
            0x01 => Ok(Pin::Pin1),
            0x02 => Ok(Pin::Pin2),
            0x04 => Ok(Pin::Pin3),
            pin => Err(InvalidPin(pin)),
        }
    }
}

fn main() {
  let Ok(p) = Pin::try_from(2) else {
    return;
  };

  // 使用 pin p
}
```

</div>

关于如何优雅地处理 `try_from` 的结果，请参见[异常与错误处理](../exceptions.md)。

如果对底层性能的需求高于内存安全，可以使用 `std::mem::transmute`，它类似于 C++ 的 reinterpret_cast，但需要使用 unsafe Rust，因为不当使用可能导致未定义行为。将 `std::mem::transmute` 用于此目的时，不应将其隐藏在可从安全 Rust 调用的接口之后，除非该接口能够实际保证不会传入无效值。

## 枚举与方法

在 C++ 中，枚举不能拥有方法。若要为枚举建模方法，必须为枚举定义一个包装类，并在该包装类上定义方法。而在 Rust 中，可以像为其他类型一样，通过 `impl` 块为枚举定义方法。

<div class="comparison">

```cpp
#include <cstdint>

// 实际的枚举
enum PinImpl : uint8_t {
  Pin1 = 0x01,
  Pin2 = 0x02,
  Pin3 = 0x04
};

class LastPin{};

// 包装类型
struct Pin {
  PinImpl pin;

  // 转换构造函数，使 PinImpl 可作为 Pin 使用。
  Pin(PinImpl p) : pin(p) {}

  // 转换方法，使包装类型可用于 switch 语句。
  operator PinImpl() {
    return this->pin;
  }

  Pin next() const {
    switch (pin) {
    case Pin1:
      return Pin(Pin2);
    case Pin2:
      return Pin(Pin3);
    default:
      throw LastPin{};
    }
  }
};
```

```rust
#[repr(u8)]
#[derive(Clone, Copy)]
enum Pin {
    Pin1 = 0x01,
    Pin2 = 0x02,
    Pin3 = 0x04,
}

struct LastPin;

impl Pin {
    fn next(&self) -> Result<Self, LastPin> {
        match self {
            Pin::Pin1 => Ok(Pin::Pin2),
            Pin::Pin2 => Ok(Pin::Pin3),
            Pin::Pin3 => Err(LastPin),
        }
    }
}
```

</div>

{{#quiz enums.toml}}
