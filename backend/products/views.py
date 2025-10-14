from django.shortcuts import render


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_item(request):
    """Agregar un producto al carrito"""
    try:
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        if not product_id:
            return Response(
                {"detail": "Se requiere product_id."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if quantity <= 0:
            return Response(
                {"detail": "La cantidad debe ser mayor a 0."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"detail": "Producto no encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar stock
        if product.stock < quantity:
            return Response(
                {"detail": f"No hay suficiente stock disponible. Stock actual: {product.stock}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener o crear carrito
        cart, created = Cart.objects.get_or_create(
            user=request.user,
            defaults={'created_at': timezone.now()}
        )
        
        # Verificar si el producto ya está en el carrito
        cart_item, item_created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not item_created:
            # Si el producto ya existe, actualizar cantidad
            new_quantity = cart_item.quantity + quantity
            if new_quantity > product.stock:
                return Response(
                    {"detail": f"No hay suficiente stock. Stock disponible: {product.stock}, cantidad en carrito: {cart_item.quantity}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart_item.quantity = new_quantity
            cart_item.save()
        
        # Serializar el carrito actualizado
        cart_serializer = CartSerializer(cart)
        
        return Response({
            "detail": "Producto agregado al carrito exitosamente.",
            "cart": cart_serializer.data
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response(
            {"detail": "Cantidad inválida."},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"detail": f"Error interno del servidor: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# Create your views here.
