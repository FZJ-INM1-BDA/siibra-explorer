import math
import struct

cipher = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-'
separator = '.'
neg = '~'
def encode_number(n, float_flag=False):
    if float_flag:
        b=struct.pack('f', n)
        new_n=struct.unpack('i',b)
        return encode_int(new_n[0])
    else:
        return encode_int(n)

def encode_int(n):
    if not isinstance(n, int):
        raise ValueError('Cannot encode int')

    residual=None
    result=''
    if n < 0:
        result += neg
        residual = n * -1
    else:
        residual = n
    
    while True:
        result = cipher[residual % 64] + result
        residual = math.floor(residual / 64)

        if residual == 0:
            break
    return result

# get_hash may not have to be implemented
# CON: add numpy dependency
# PRO: might need to support hashing region name for selected region
#
# def get_hash(full_string: str):
#     return_val=0
#     with np.errstate(over="ignore"):
#         for char in full_string:
#             # overflowing is expected and in fact the whole reason why convert number to int32
            
#             # in windows, int32((0 - min_int32) << 5), rather than overflow to wraper around, raises OverflowError
#             shifted_5 = int32(
#                 (return_val - min_int32) if return_val > max_int32 else return_val
#             << 5)

#             return_val = int32(shifted_5 - return_val + ord(char))
#             return_val = return_val & return_val
#     hex_val = hex(return_val)
#     return hex_val[3:]

