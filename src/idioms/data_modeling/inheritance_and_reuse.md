# 继承与实现复用

Rust 没有继承机制，因此 Rust 中实现复用的主要方式是组合、聚合和[泛型](./templates.md)。

不过，Rust 的 trait 支持默认方法，这类似于用继承来复用实现的简单场景。例如，下面的例子中，两个虚函数用于支持一个由抽象类提供实现的方法。

<div class="comparison">

```cpp
#include <iostream>
#include <string>

class Device {
public:
    virtual void powerOn() = 0;
    virtual void powerOff() = 0;

    virtual void resetDevice() {
        std::cout << "Resetting device..." << std::endl;
        powerOff();
        powerOn();
    }

    virtual ~Device() {}
};

class Printer : public Device {
    bool powered = false;
public:
    void powerOn() override {
        this.powered = true;
        std::cout << "Printer is powered on." << std::endl;
    }

    void powerOff() override {
        this.powered = false;
        std::cout << "Printer is powered off." << std::endl;
    }
};

int main() {
    Printer myPrinter;
    myPrinter.resetDevice();
}
```

```rust
trait Device {
    fn power_on(&mut self);
    fn power_off(&mut self);

    fn reset_device(&mut self) {
        println!("Resetting device...");
        self.power_on();
        self.power_off();
    }
}

struct Printer {
    powered: bool,
}

impl Printer {
    fn new() -> Printer {
        Printer { powered: false }
    }
}

impl Device for Printer {
    fn power_on(&mut self) {
        self.powered = true;
        println!("Printer is powered on");
    }

    fn power_off(&mut self) {
        self.powered = false;
        println!("Printer is powered off");
    }
}

fn main() {
    let mut p = Printer::new();
    p.reset_device();
}
```

</div>

实际上，如果 `Device` 类中的 `resetDevice()` 方法不需要被重写，在 C++ 中它可以被声明为非虚函数。为了与 Rust 示例保持一致，这里将其声明为虚函数，因为 Rust 的 trait 既可以用于[动态分发](./abstract_classes.md)，也可以用于[静态分发](./concepts.md)（[静态分发情况下没有 vtable 开销](./abstract_classes.md#vtables-and-rust-trait-object-types)）。

Rust 的 trait 与抽象类还有其他一些区别。例如，Rust 的 trait 不能定义数据成员，也不能定义私有或受保护的方法。这限制了 trait 在实现模板方法模式时的能力。

Rust 的 trait 也不能被私有实现。只要 trait 和实现该 trait 的类型都可见，trait 的方法就会作为类型的方法可见。

不过，trait 之间可以相互继承，包括多重继承。与现代 C++ 类似，Rust 中的继承层次通常较浅。在涉及复杂多重继承的场景下，Rust 不会出现菱形继承问题，因为 trait 不能重写其他 trait 的实现。因此，所有通向同一个父 trait 的路径都会解析为同一个实现。

{{#quiz inheritance_and_reuse.toml}}
