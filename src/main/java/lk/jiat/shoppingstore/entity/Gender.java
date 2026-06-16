package lk.jiat.shoppingstore.entity;

import jakarta.persistence.*;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Entity
@NamedQuery(
        name = "Gender.findByName",
        query = "FROM Gender g WHERE g.name = :name"
)
public class Gender implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(length = 45, nullable = false, unique = true)
    private String name;


    // One gender can have many products
    @OneToMany(mappedBy = "gender", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Product> product = new ArrayList<>();

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }


    public List<Product> getProduct() {
        return product;
    }

    public void setProduct(List<Product> products) {
        this.product = products;
    }
}
